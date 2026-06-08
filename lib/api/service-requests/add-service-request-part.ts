"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
} from "@/lib/api/service-requests/auth";
import {
  assertStatus,
  emptyToNull,
  loadServiceRequestForEdit,
} from "@/lib/api/service-requests/service-request-helpers";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import type { ActionResult } from "@/lib/api/service-requests/types";
import {
  assertSufficientStock,
  refreshCurrentStock,
} from "@/lib/api/stock/stock-helpers";
import { ensurePartBranchStock } from "@/lib/api/stock/stock-movement-helpers";
import type { StockApiContext } from "@/lib/api/stock/auth";
import { addServiceRequestPartSchema } from "@/schemas/service-request";

async function toStockContext(
  ctx: Awaited<ReturnType<typeof getServiceRequestApiContext>>,
): Promise<StockApiContext> {
  return {
    supabase: ctx.supabase,
    user: ctx.user,
    permissions: ctx.permissions,
    branchScope: ctx.branchScope,
  };
}

export async function addServiceRequestPart(
  rawInput: unknown,
): Promise<ActionResult<{ partRowId: string }>> {
  try {
    const input = addServiceRequestPartSchema.parse(rawInput);
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const row = await loadServiceRequestForEdit(ctx, input.serviceRequestId);
    assertStatus(row, ["teklif_onaylandi"]);

    const stockCtx = await toStockContext(ctx);
    await ensurePartBranchStock(stockCtx, input.partId, row.branch_id);
    await assertSufficientStock(
      ctx.supabase,
      input.partId,
      row.branch_id,
      input.quantity,
    );

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("service_request_parts")
      .insert({
        service_request_id: input.serviceRequestId,
        part_id: input.partId,
        quantity: input.quantity,
        notes: emptyToNull(input.notes),
        created_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Parça eklenemedi");
    }

    await refreshCurrentStock(ctx.supabase);
    revalidateServiceRequestPaths(input.serviceRequestId);
    revalidatePath("/stock");
    revalidatePath(`/stock/${input.partId}`);

    return { success: true, data: { partRowId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
