"use server";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
} from "@/lib/api/service-requests/auth";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import {
  assertStatus,
  loadServiceRequestForEdit,
  validateDeviceModelId,
} from "@/lib/api/service-requests/service-request-helpers";
import type { ActionResult } from "@/lib/api/service-requests/types";
import {
  updateServiceRequestStep1Schema,
  type UpdateServiceRequestStep1Input,
} from "@/schemas/service-request";

/** Adım 1 kaydet ve Adım 2'ye geç. */
export async function advanceServiceRequestFromStep1(
  rawInput: UpdateServiceRequestStep1Input,
): Promise<ActionResult<{ serviceRequestId: string; status: string }>> {
  try {
    const input = updateServiceRequestStep1Schema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["draft"]);
    await validateDeviceModelId(ctx, input.device_model_id);

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        company_name: input.company_name.trim(),
        contact_name: input.contact_name.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        device_type: input.device_type.trim(),
        brand_model: input.brand_model.trim(),
        device_model_id: input.device_model_id,
        serial_number: input.serial_number.trim(),
        under_warranty: input.under_warranty,
        reported_fault: input.reported_fault.trim(),
        status: "ariza_tespit",
        current_step: 2,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(input.id);

    return {
      success: true,
      data: { serviceRequestId: input.id, status: "ariza_tespit" },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

/** Adım 2 kaydet ve Adım 3'e geç. */
export async function advanceServiceRequestFromStep2(
  serviceRequestId: string,
): Promise<ActionResult<{ serviceRequestId: string; status: string }>> {
  try {
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, serviceRequestId);
    assertStatus(row, ["ariza_tespit"]);

    if (
      !row.diagnosed_fault?.trim() ||
      !row.customer_statement?.trim() ||
      !row.technical_inspection_result?.trim()
    ) {
      throw new Error("Arıza tespit alanları eksik — önce kaydedin");
    }

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        status: "teklif_hazir",
        current_step: 3,
      })
      .eq("id", serviceRequestId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(serviceRequestId);

    return {
      success: true,
      data: { serviceRequestId, status: "teklif_hazir" },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

/** Adım 4 tamamlandı — Adım 5'e geç. */
export async function completeServiceRequestMaintenance(
  serviceRequestId: string,
): Promise<ActionResult<{ serviceRequestId: string; status: string }>> {
  try {
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, serviceRequestId);
    assertStatus(row, ["teklif_onaylandi"]);

    if (!row.work_description?.trim()) {
      throw new Error("Yapılan iş açıklaması gereklidir");
    }
    if (!row.delivery_method) {
      throw new Error("Teslim şekli seçilmelidir");
    }
    if (!row.delivered) {
      throw new Error("Teslim edildi onayı gereklidir");
    }

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        status: "bakim_yapiliyor",
        current_step: 5,
      })
      .eq("id", serviceRequestId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(serviceRequestId);

    return {
      success: true,
      data: { serviceRequestId, status: "bakim_yapiliyor" },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
