"use server";

import {
  getStockApiContext,
  resolveBranchFilter,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import { matchesDateRange } from "@/lib/api/stock/stock-helpers";
import {
  mapStockMovementRows,
  type RawMovementRow,
} from "@/lib/api/stock/stock-movement-helpers";
import type { StockMovementListResult } from "@/lib/api/stock/types";
import {
  stockMovementFilterSchema,
  type StockMovementFilterInput,
} from "@/schemas/stock-movement";

const MOVEMENTS_LIST_SELECT = `
  id,
  part_id,
  branch_id,
  movement_type,
  quantity_change,
  reason,
  notes,
  reference_type,
  reference_id,
  created_at,
  created_by,
  branches!inventory_movements_branch_id_fkey (
    name
  ),
  creator:users!inventory_movements_created_by_fkey (
    full_name
  )
`;

export async function getStockMovements(
  rawFilters: StockMovementFilterInput,
): Promise<StockMovementListResult> {
  try {
    const filters = stockMovementFilterSchema.parse(rawFilters);
    const ctx = await getStockApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let query = ctx.supabase
      .from("inventory_movements")
      .select(MOVEMENTS_LIST_SELECT)
      .order("created_at", { ascending: false });

    if (filters.partId) {
      query = query.eq("part_id", filters.partId);
    }

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (filters.movementType) {
      query = query.eq("movement_type", filters.movementType);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    let mapped = await mapStockMovementRows(
      ctx.supabase,
      (rows ?? []) as unknown as RawMovementRow[],
    );

    if (filters.dateFrom || filters.dateTo) {
      mapped = mapped.filter((row) =>
        matchesDateRange(row.created_at, filters.dateFrom, filters.dateTo),
      );
    }

    const total = mapped.length;
    const from = (filters.page - 1) * filters.pageSize;
    const data = mapped.slice(from, from + filters.pageSize);

    return {
      data,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
