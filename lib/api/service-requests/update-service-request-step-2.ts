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
} from "@/lib/api/service-requests/service-request-helpers";
import type { ActionResult } from "@/lib/api/service-requests/types";
import {
  updateServiceRequestStep2Schema,
  type UpdateServiceRequestStep2Input,
} from "@/schemas/service-request";

export async function updateServiceRequestStep2(
  rawInput: UpdateServiceRequestStep2Input,
): Promise<ActionResult<{ serviceRequestId: string }>> {
  try {
    const input = updateServiceRequestStep2Schema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["ariza_tespit"]);

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        diagnosed_fault: input.diagnosed_fault.trim(),
        customer_statement: input.customer_statement.trim(),
        technical_inspection_result: input.technical_inspection_result.trim(),
        wrong_usage_detected: input.wrong_usage_detected,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(input.id);

    return { success: true, data: { serviceRequestId: input.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
