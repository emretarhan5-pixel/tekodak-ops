"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import { revalidateWorkOrderRelatedPaths } from "@/lib/api/work-orders/work-order-revalidate-paths";
import { isTerminalWorkOrderStatus } from "@/lib/api/work-orders/work-order-status";
import type { ActionResult } from "@/lib/api/work-orders/types";
import {
  assertSufficientStock,
  emptyToNull,
  refreshCurrentStock,
} from "@/lib/api/stock/stock-helpers";
import { ensurePartBranchStock } from "@/lib/api/stock/stock-movement-helpers";
import type { StockApiContext } from "@/lib/api/stock/auth";
import type { WorkOrderStatus } from "@/lib/constants/work-order";
import { addWorkOrderPartSchema } from "@/schemas/work-order";

async function assertStockContext(
  ctx: Awaited<ReturnType<typeof getWorkOrderApiContext>>,
): Promise<StockApiContext> {
  return {
    supabase: ctx.supabase,
    user: ctx.user,
    permissions: ctx.permissions,
    branchScope: ctx.branchScope,
  };
}

export async function addWorkOrderPart(
  rawInput: unknown,
): Promise<ActionResult<{ partRowId: string }>> {
  try {
    const input = addWorkOrderPartSchema.parse(rawInput);
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const { data: workOrder, error: loadError } = await ctx.supabase
      .from("work_orders")
      .select("id, branch_id, customer_id, device_id, contract_id, status")
      .eq("id", input.workOrderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!workOrder) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    if (isTerminalWorkOrderStatus(workOrder.status as WorkOrderStatus)) {
      throw new WorkOrderApiError(
        "Tamamlanmış veya iptal edilmiş iş emrine parça eklenemez",
        "FORBIDDEN",
      );
    }

    assertCanAccessBranch(ctx, workOrder.branch_id);

    const stockCtx = await assertStockContext(ctx);
    await ensurePartBranchStock(stockCtx, input.partId, workOrder.branch_id);
    await assertSufficientStock(
      ctx.supabase,
      input.partId,
      workOrder.branch_id,
      input.quantity,
    );

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("work_order_parts")
      .insert({
        work_order_id: input.workOrderId,
        part_id: input.partId,
        quantity: input.quantity,
        notes: emptyToNull(input.notes),
        added_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Parça eklenemedi");
    }

    await refreshCurrentStock(ctx.supabase);
    await revalidateWorkOrderRelatedPaths(workOrder);
    revalidatePath("/stock");
    revalidatePath(`/stock/${input.partId}`);

    return { success: true, data: { partRowId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
