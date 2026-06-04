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
import { refreshCurrentStock } from "@/lib/api/stock/stock-helpers";
import type { WorkOrderStatus } from "@/lib/constants/work-order";

export async function removeWorkOrderPart(
  partRowId: string,
): Promise<ActionResult<{ partRowId: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const { data: partRow, error: loadError } = await ctx.supabase
      .from("work_order_parts")
      .select(
        `
        id,
        part_id,
        work_order_id,
        work_orders!inner (
          id,
          branch_id,
          customer_id,
          device_id,
          contract_id,
          status,
          deleted_at
        )
      `,
      )
      .eq("id", partRowId)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!partRow) {
      throw new WorkOrderApiError("Parça kaydı bulunamadı", "NOT_FOUND");
    }

    const row = partRow as typeof partRow & {
      part_id: string;
      work_orders: {
        id: string;
        branch_id: string;
        customer_id: string;
        device_id: string | null;
        contract_id: string | null;
        status: WorkOrderStatus;
        deleted_at: string | null;
      };
    };

    if (row.work_orders.deleted_at) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    if (isTerminalWorkOrderStatus(row.work_orders.status)) {
      throw new WorkOrderApiError(
        "Tamamlanmış veya iptal edilmiş iş emrinden parça kaldırılamaz",
        "FORBIDDEN",
      );
    }

    assertCanAccessBranch(ctx, row.work_orders.branch_id);

    const { error: deleteError } = await ctx.supabase
      .from("work_order_parts")
      .delete()
      .eq("id", partRowId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await refreshCurrentStock(ctx.supabase);
    await revalidateWorkOrderRelatedPaths(row.work_orders);
    revalidatePath("/stock");
    revalidatePath(`/stock/${row.part_id}`);

    return { success: true, data: { partRowId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
