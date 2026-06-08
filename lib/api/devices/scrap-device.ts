"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import { notifyAllAdmins } from "@/lib/api/devices/scrap-notify";
import type { ActionResult } from "@/lib/api/devices/types";
import {
  assertCanEditServiceRequest,
  getServiceRequestApiContext,
} from "@/lib/api/service-requests/auth";
import { loadServiceRequestOrThrow } from "@/lib/api/service-requests/service-request-helpers";
import {
  DEVICE_SCRAP_NEXT_STEP_LABELS,
  DEVICE_SCRAP_NEXT_STEPS,
  DEVICE_SCRAP_REASONS,
} from "@/lib/constants/device-scrap";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/lib/supabase/types";

const requestScrapSchema = z.object({
  deviceId: z.string().uuid(),
  reason: z.enum(DEVICE_SCRAP_REASONS, {
    errorMap: () => ({ message: "Hek nedeni seçin" }),
  }),
  notes: z
    .string()
    .trim()
    .min(20, "Hek açıklaması en az 20 karakter olmalıdır")
    .max(5000),
  nextStep: z.enum(DEVICE_SCRAP_NEXT_STEPS, {
    errorMap: () => ({ message: "Müşteriye öneri seçin" }),
  }),
  serviceRequestId: z.string().uuid(),
});

export async function requestScrap(
  deviceId: string,
  reason: z.infer<typeof requestScrapSchema>["reason"],
  notes: string,
  nextStep: z.infer<typeof requestScrapSchema>["nextStep"],
  serviceRequestId: string,
): Promise<ActionResult<{ deviceId: string }>> {
  try {
    const input = requestScrapSchema.parse({
      deviceId,
      reason,
      notes,
      nextStep,
      serviceRequestId,
    });

    const srCtx = await getServiceRequestApiContext();
    const sr = await loadServiceRequestOrThrow(srCtx, input.serviceRequestId);
    assertCanEditServiceRequest(srCtx, sr);

    if (sr.status !== "ariza_tespit") {
      throw new DeviceApiError(
        "Hek talebi yalnızca arıza tespit adımından gönderilebilir",
        "FORBIDDEN",
      );
    }

    const ctx = await getDeviceApiContext();

    const { data: device, error: loadError } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        serial_number,
        branch_id,
        is_scrapped,
        scrap_status,
        customers!devices_customer_id_fkey!inner ( branch_id )
      `,
      )
      .eq("id", input.deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!device) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = device as unknown as {
      id: string;
      serial_number: string;
      branch_id: string;
      is_scrapped: boolean;
      scrap_status: string | null;
      customers: { branch_id: string };
    };

    if (ctx.branchScope && row.customers.branch_id !== ctx.branchScope) {
      throw new DeviceApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
    }

    if (row.is_scrapped) {
      return { success: false, error: "Bu cihaz zaten hek olarak işaretlenmiş" };
    }

    if (row.scrap_status === "pending_approval") {
      return {
        success: false,
        error: "Bu cihaz için zaten hek onayı bekleniyor",
      };
    }

    if (!sr.device_id) {
      const { error: linkError } = await srCtx.supabase
        .from("service_requests")
        .update({ device_id: input.deviceId })
        .eq("id", input.serviceRequestId);

      if (linkError) {
        throw new Error(linkError.message);
      }
    }

    const now = new Date().toISOString();
    const patch: TablesUpdate<"devices"> = {
      is_scrapped: false,
      scrap_status: "pending_approval",
      scrap_reason: input.reason,
      scrap_notes: input.notes,
      scrap_next_step: input.nextStep,
      scrapped_by: ctx.user.id,
      scrapped_at: now,
      scrap_approved_by: null,
      scrap_approved_at: null,
      scrap_rejection_reason: null,
      updated_by: ctx.user.id,
    };

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("devices")
      .update(patch)
      .eq("id", input.deviceId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const technicianName = srCtx.user.full_name?.trim() || "Teknisyen";
    const nextStepLabel = DEVICE_SCRAP_NEXT_STEP_LABELS[input.nextStep];

    await notifyAllAdmins({
      type: "scrap_approval_requested",
      title: "Hek Onayı Gerekiyor",
      message: `${technicianName} ${row.serial_number} cihazını hek olarak işaretledi. Teknisyen önerisi: ${nextStepLabel}. Onayınız gerekiyor.`,
      entityType: "device",
      entityId: input.deviceId,
      actionUrl: `/devices/${input.deviceId}`,
      priority: "high",
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${input.deviceId}`);
    revalidatePath(`/service-requests/${input.serviceRequestId}`);

    return { success: true, data: { deviceId: input.deviceId } };
  } catch (error) {
    if (error instanceof DeviceApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toActionError(error) };
  }
}
