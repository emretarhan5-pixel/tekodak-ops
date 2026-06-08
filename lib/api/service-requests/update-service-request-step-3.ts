"use server";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
} from "@/lib/api/service-requests/auth";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import {
  assertStatus,
  calculateQuoteTotals,
  loadServiceRequestForEdit,
  syncQuoteLines,
} from "@/lib/api/service-requests/service-request-helpers";
import type { ActionResult } from "@/lib/api/service-requests/types";
import {
  serviceRequestCustomerDecisionSchema,
  updateServiceRequestStep3Schema,
  type ServiceRequestCustomerDecisionInput,
  type UpdateServiceRequestStep3Input,
} from "@/schemas/service-request";

export async function updateServiceRequestStep3(
  rawInput: UpdateServiceRequestStep3Input,
): Promise<ActionResult<{ serviceRequestId: string; quoteTotal: number }>> {
  try {
    const input = updateServiceRequestStep3Schema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["teklif_hazir"]);

    const { quoteSubtotal, quoteTotal } = calculateQuoteTotals({
      quoteLines: input.quote_lines,
      laborCost: input.labor_cost,
      shippingCost: input.shipping_cost,
      vatOption: input.vat_option,
    });

    await syncQuoteLines(ctx, input.id, input.quote_lines);

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        labor_cost: input.labor_cost,
        shipping_cost: input.shipping_cost ?? null,
        vat_option: input.vat_option,
        quote_subtotal: quoteSubtotal,
        quote_total: quoteTotal,
        quote_sent_to_customer: input.quote_sent_to_customer,
        customer_decision: "pending",
        device_returned: false,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(input.id);

    return {
      success: true,
      data: { serviceRequestId: input.id, quoteTotal },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function submitServiceRequestCustomerDecision(
  rawInput: ServiceRequestCustomerDecisionInput,
): Promise<ActionResult<{ serviceRequestId: string; status: string }>> {
  try {
    const input = serviceRequestCustomerDecisionSchema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.id);
    assertStatus(row, ["teklif_hazir"]);

    if (row.quote_total == null) {
      throw new Error("Önce teklif kaydedilmelidir");
    }

    if (input.customer_decision === "approved") {
      const { error } = await ctx.supabase
        .from("service_requests")
        .update({
          customer_decision: "approved",
          device_returned: false,
          status: "teklif_onaylandi",
          current_step: 4,
        })
        .eq("id", input.id);

      if (error) {
        throw new Error(error.message);
      }

      revalidateServiceRequestPaths(input.id);

      return {
        success: true,
        data: { serviceRequestId: input.id, status: "teklif_onaylandi" },
      };
    }

    const { error } = await ctx.supabase
      .from("service_requests")
      .update({
        customer_decision: "rejected",
        device_returned: true,
        status: "rejected",
        current_step: 3,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateServiceRequestPaths(input.id);

    return {
      success: true,
      data: { serviceRequestId: input.id, status: "rejected" },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
