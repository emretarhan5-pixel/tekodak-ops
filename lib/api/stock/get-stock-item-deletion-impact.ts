"use server";

import {
  getStockApiContext,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import type { StockItemDeletionImpact } from "@/lib/api/stock/types";

export async function getStockItemDeletionImpact(
  partId: string,
): Promise<StockItemDeletionImpact> {
  try {
    const ctx = await getStockApiContext();

    const [movementsRes, workOrderPartsRes, branchStockRes] = await Promise.all([
      ctx.supabase
        .from("inventory_movements")
        .select("id", { count: "exact", head: true })
        .eq("part_id", partId),
      ctx.supabase
        .from("work_order_parts")
        .select("id", { count: "exact", head: true })
        .eq("part_id", partId),
      ctx.supabase
        .from("part_branch_stock")
        .select("id", { count: "exact", head: true })
        .eq("part_id", partId),
    ]);

    if (movementsRes.error) {
      throw new Error(movementsRes.error.message);
    }
    if (workOrderPartsRes.error) {
      throw new Error(workOrderPartsRes.error.message);
    }
    if (branchStockRes.error) {
      throw new Error(branchStockRes.error.message);
    }

    return {
      movementCount: movementsRes.count ?? 0,
      workOrderPartCount: workOrderPartsRes.count ?? 0,
      branchStockCount: branchStockRes.count ?? 0,
    };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
