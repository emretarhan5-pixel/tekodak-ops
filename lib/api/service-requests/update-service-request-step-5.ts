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
  updateServiceRequestStep5Schema,
  type UpdateServiceRequestStep5Input,
} from "@/schemas/service-request";

export async function closeServiceRequest(
  rawInput: UpdateServiceRequestStep5Input,
): Promise<ActionResult<{ serviceRequestId: string; status: string }>> {
  try {
    const input = updateServiceRequestStep5Schema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["bakim_yapiliyor"]);

    const now = new Date().toISOString();

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        invoice_issued: input.invoice_issued,
        invoice_number: input.invoice_number.trim(),
        payment_received: true,
        status: "tamamlandi",
        current_step: 5,
        completed_at: now,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(input.id);

    return {
      success: true,
      data: { serviceRequestId: input.id, status: "tamamlandi" },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
