"use server";

import {
  getStockApiContext,
  resolveBranchFilter,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import { isTrackedBranchStockRow } from "@/lib/api/stock/stock-helpers";
import type { RawCurrentStockRow } from "@/lib/api/stock/stock-list-helpers";
import type { StockListSummary } from "@/lib/api/stock/types";

export async function getStockListSummary(
  branchId?: string,
): Promise<StockListSummary> {
  try {
    const ctx = await getStockApiContext();
    const resolvedBranchId = resolveBranchFilter(ctx, branchId);

    let query = ctx.supabase.from("current_stock").select("*");

    if (resolvedBranchId) {
      query = query.eq("branch_id", resolvedBranchId);
    }

    const { data: rawRows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const trackedRows = ((rawRows ?? []) as RawCurrentStockRow[]).filter(
      (row) =>
        row.part_id &&
        row.branch_id &&
        isTrackedBranchStockRow(
          row.min_stock,
          Number(row.current_quantity ?? 0),
        ),
    );

    let criticalCount = 0;
    let warningCount = 0;

    for (const row of trackedRows) {
      const qty = Number(row.current_quantity ?? 0);
      if (qty <= 0) continue;

      if (row.stock_status === "critical") {
        criticalCount += 1;
      } else if (row.stock_status === "warning") {
        warningCount += 1;
      }
    }

    return {
      totalItems: trackedRows.length,
      criticalCount,
      warningCount,
    };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
