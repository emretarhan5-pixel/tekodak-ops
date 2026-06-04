"use server";

import {
  getStockApiContext,
  resolveBranchFilter,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import { isTrackedBranchStockRow } from "@/lib/api/stock/stock-helpers";
import {
  applyStockStatusFilter,
  mapStockListItem,
  type PartMetaRow,
  type RawCurrentStockRow,
} from "@/lib/api/stock/stock-list-helpers";
import type { StockListResult } from "@/lib/api/stock/types";
import { stockItemFilterSchema, type StockItemFilterInput } from "@/schemas/stock-item";

export async function getStockItems(
  rawFilters: StockItemFilterInput,
): Promise<StockListResult> {
  try {
    const filters = stockItemFilterSchema.parse(rawFilters);
    const ctx = await getStockApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let categoryPartIds: string[] | null = null;
    if (filters.category) {
      const { data: categoryParts, error: categoryError } = await ctx.supabase
        .from("parts")
        .select("id")
        .eq("category", filters.category)
        .is("deleted_at", null);

      if (categoryError) {
        throw new Error(categoryError.message);
      }

      categoryPartIds = (categoryParts ?? []).map((row) => row.id);
      if (categoryPartIds.length === 0) {
        return {
          data: [],
          total: 0,
          page: filters.page,
          pageSize: filters.pageSize,
        };
      }
    }

    let query = ctx.supabase.from("current_stock").select("*");

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (categoryPartIds) {
      query = query.in("part_id", categoryPartIds);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, "\\%");
      query = query.or(
        `part_code.ilike.%${term}%,description.ilike.%${term}%`,
      );
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

    const statusFiltered = applyStockStatusFilter(trackedRows, filters.status);

    const partIds = [...new Set(statusFiltered.map((row) => row.part_id!))];
    const partMeta = new Map<string, PartMetaRow>();

    if (partIds.length > 0) {
      const { data: parts, error: partsError } = await ctx.supabase
        .from("parts")
        .select("id, category, unit")
        .in("id", partIds)
        .is("deleted_at", null);

      if (partsError) {
        throw new Error(partsError.message);
      }

      for (const part of (parts ?? []) as PartMetaRow[]) {
        partMeta.set(part.id, part);
      }
    }

    const mapped = statusFiltered
      .map((row) => {
        const meta = partMeta.get(row.part_id!);
        if (!meta) return null;
        return mapStockListItem(row, meta);
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((a, b) => {
        const code = a.part_code.localeCompare(b.part_code, "tr");
        if (code !== 0) return code;
        return a.branch_name.localeCompare(b.branch_name, "tr");
      });

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
