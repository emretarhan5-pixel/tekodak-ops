"use server";

import { revalidatePath } from "next/cache";

import { findOrCreateDeviceForScrap } from "@/lib/api/devices/find-or-create-device-for-scrap";
import { requestScrap } from "@/lib/api/devices/scrap-device";
import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
} from "@/lib/api/service-requests/auth";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import {
  assertStatus,
  loadServiceRequestForEdit,
} from "@/lib/api/service-requests/service-request-helpers";
import type { ActionResult } from "@/lib/api/service-requests/types";
import { updateServiceRequestStep2 } from "@/lib/api/service-requests/update-service-request-step-2";
import {
  submitServiceRequestScrapFromStep2Schema,
  type SubmitServiceRequestScrapFromStep2Input,
} from "@/schemas/service-request";

export async function submitServiceRequestScrapFromStep2(
  rawInput: SubmitServiceRequestScrapFromStep2Input,
): Promise<ActionResult<{ serviceRequestId: string; deviceId: string }>> {
  try {
    const input = submitServiceRequestScrapFromStep2Schema.parse(rawInput);

    const saveResult = await updateServiceRequestStep2({
      id: input.id,
      diagnosed_fault: input.diagnosed_fault,
      customer_statement: input.customer_statement,
      technical_inspection_result: input.technical_inspection_result,
      wrong_usage_detected: input.wrong_usage_detected,
    });

    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    const deviceResult = await findOrCreateDeviceForScrap(input.id);
    if (!deviceResult.success) {
      return { success: false, error: deviceResult.error };
    }

    const scrapResult = await requestScrap(
      deviceResult.data.deviceId,
      input.scrap_reason,
      input.scrap_notes,
      input.scrap_next_step,
      input.id,
    );

    if (!scrapResult.success) {
      return { success: false, error: scrapResult.error };
    }

    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["ariza_tespit"]);

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        status: "rejected",
        customer_decision: "rejected",
        device_returned: true,
        current_step: 3,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(input.id);
    revalidatePath("/service-requests");
    revalidatePath(`/devices/${deviceResult.data.deviceId}`);

    return {
      success: true,
      data: {
        serviceRequestId: input.id,
        deviceId: deviceResult.data.deviceId,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
