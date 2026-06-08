"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DeviceApiError,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";
import {
  assertCanEditServiceRequest,
  getServiceRequestApiContext,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import { loadServiceRequestForEdit } from "@/lib/api/service-requests/service-request-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";

const findOrCreateSchema = z.object({
  serviceRequestId: z.string().uuid(),
});

export async function findOrCreateDeviceForScrap(
  serviceRequestId: string,
): Promise<
  ActionResult<{ deviceId: string; created: boolean; serialNumber: string }>
> {
  try {
    const input = findOrCreateSchema.parse({ serviceRequestId });
    const ctx = await getServiceRequestApiContext();
    const sr = await loadServiceRequestForEdit(ctx, input.serviceRequestId);
    assertCanEditServiceRequest(ctx, sr);

    const serialNumber = sr.serial_number.trim();
    if (!serialNumber) {
      return { success: false, error: "Servis talebinde seri numarası bulunamadı" };
    }

    const { data: existing, error: findError } = await ctx.supabase
      .from("devices")
      .select("id, is_scrapped, scrap_status")
      .eq("serial_number", serialNumber)
      .is("deleted_at", null)
      .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (existing) {
      const device = existing as {
        id: string;
        is_scrapped: boolean;
        scrap_status: string | null;
      };

      if (device.is_scrapped) {
        return {
          success: false,
          error: "Bu cihaz hek olarak işaretlenmiştir",
        };
      }

      if (device.scrap_status === "pending_approval") {
        return {
          success: false,
          error: "Bu cihaz için hek onayı bekliyor",
        };
      }

      const { error: linkError } = await ctx.supabase
        .from("service_requests")
        .update({ device_id: device.id })
        .eq("id", input.serviceRequestId);

      if (linkError) {
        throw new Error(linkError.message);
      }

      revalidatePath(`/service-requests/${input.serviceRequestId}`);

      return {
        success: true,
        data: {
          deviceId: device.id,
          created: false,
          serialNumber,
        },
      };
    }

    if (!sr.device_model_id) {
      return {
        success: false,
        error:
          "Cihaz kaydı için servis talebinde katalog model seçimi gereklidir",
      };
    }

    const customerId = await resolveCustomerId(ctx, sr);
    if (!customerId) {
      return {
        success: false,
        error:
          "Cihaz kaydı için müşteri bilgisi gereklidir. Servis talebine müşteri bağlayın veya firma adını mevcut müşteriyle eşleştirin.",
      };
    }

    const { data: model, error: modelError } = await ctx.supabase
      .from("device_models")
      .select("id, brand_id")
      .eq("id", sr.device_model_id)
      .maybeSingle();

    if (modelError) {
      throw new Error(modelError.message);
    }

    if (!model) {
      return { success: false, error: "Seçilen model bulunamadı" };
    }

    const today = new Date().toISOString().slice(0, 10);
    const notes = `ST-${sr.request_number} üzerinden otomatik oluşturuldu`;

    const row: TablesInsert<"devices"> = {
      serial_number: serialNumber,
      brand_id: model.brand_id,
      model_id: model.id,
      customer_id: customerId,
      branch_id: sr.branch_id,
      status: "active",
      warranty_start_date: today,
      notes,
      created_by: ctx.user.id,
      updated_by: ctx.user.id,
    };

    const admin = createAdminClient();
    const { data: created, error: insertError } = await admin
      .from("devices")
      .insert(row)
      .select("id")
      .single();

    if (insertError || !created) {
      if (insertError?.code === "23505") {
        return {
          success: false,
          error: "Bu seri numarası ile kayıtlı bir cihaz zaten var",
        };
      }
      throw new Error(insertError?.message ?? "Cihaz oluşturulamadı");
    }

    const { error: linkError } = await ctx.supabase
      .from("service_requests")
      .update({ device_id: created.id })
      .eq("id", input.serviceRequestId);

    if (linkError) {
      throw new Error(linkError.message);
    }

    revalidatePath("/devices");
    revalidatePath(`/service-requests/${input.serviceRequestId}`);

    return {
      success: true,
      data: {
        deviceId: created.id,
        created: true,
        serialNumber,
      },
    };
  } catch (error) {
    if (error instanceof DeviceApiError || error instanceof ServiceRequestApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toActionError(error) };
  }
}

async function resolveCustomerId(
  ctx: Awaited<ReturnType<typeof getServiceRequestApiContext>>,
  sr: {
    customer_id?: string | null;
    company_name: string;
    branch_id: string;
  },
): Promise<string | null> {
  const explicitCustomerId = (sr as { customer_id?: string | null })
    .customer_id;

  if (explicitCustomerId) {
    const { data: customer, error } = await ctx.supabase
      .from("customers")
      .select("id")
      .eq("id", explicitCustomerId)
      .eq("branch_id", sr.branch_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return customer?.id ?? null;
  }

  const companyName = sr.company_name.trim();
  if (!companyName) {
    return null;
  }

  const { data: matched, error: matchError } = await ctx.supabase
    .from("customers")
    .select("id")
    .eq("branch_id", sr.branch_id)
    .ilike("name", companyName)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (matchError) {
    throw new Error(matchError.message);
  }

  return matched?.id ?? null;
}
