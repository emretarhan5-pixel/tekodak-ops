"use server";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
} from "@/lib/api/service-requests/auth";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import {
  resolveBranchIdForCreate,
  validateDeviceModelId,
} from "@/lib/api/service-requests/service-request-helpers";
import type { ActionResult } from "@/lib/api/service-requests/types";
import type { TablesInsert } from "@/lib/supabase/types";
import {
  createServiceRequestSchema,
  type CreateServiceRequestInput,
} from "@/schemas/service-request";

export async function createServiceRequest(
  rawInput: CreateServiceRequestInput,
): Promise<
  ActionResult<{ serviceRequestId: string; requestNumber: string }>
> {
  try {
    const input = createServiceRequestSchema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const branchId = resolveBranchIdForCreate(ctx, input.branch_id);
    await validateDeviceModelId(ctx, input.device_model_id);

    const row: TablesInsert<"service_requests"> = {
      request_number: "",
      branch_id: branchId,
      status: "ariza_tespit",
      current_step: 2,
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
      assigned_technician_id: ctx.user.id,
      created_by: ctx.user.id,
    };

    const { data, error } = await ctx.supabase
      .from("service_requests")
      .insert(row)
      .select("id, request_number")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Servis talebi oluşturulamadı");
    }

    revalidateServiceRequestPaths(data.id);

    return {
      success: true,
      data: {
        serviceRequestId: data.id,
        requestNumber: data.request_number,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
