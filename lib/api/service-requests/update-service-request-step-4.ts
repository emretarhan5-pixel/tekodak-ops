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
  updateServiceRequestStep4Schema,
  type UpdateServiceRequestStep4Input,
} from "@/schemas/service-request";

export async function updateServiceRequestStep4(
  rawInput: UpdateServiceRequestStep4Input,
): Promise<ActionResult<{ serviceRequestId: string }>> {
  try {
    const input = updateServiceRequestStep4Schema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["teklif_onaylandi"]);

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        work_description: input.work_description.trim(),
        delivery_method: input.delivery_method,
        delivered: input.delivered,
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
