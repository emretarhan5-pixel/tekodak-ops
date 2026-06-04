"use server";

import {
  getStockApiContext,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import type { StockFilterOptions } from "@/lib/api/stock/types";
import {
  PART_CATEGORY_LABELS,
  type PartCategory,
} from "@/lib/constants/stock-item";

export async function getStockFilterOptions(): Promise<StockFilterOptions> {
  try {
    const ctx = await getStockApiContext();

    const branchesRes = ctx.branchScope
      ? await ctx.supabase
          .from("branches")
          .select("id, name, code")
          .eq("id", ctx.branchScope)
          .maybeSingle()
      : await ctx.supabase
          .from("branches")
          .select("id, name, code")
          .eq("is_active", true)
          .order("name", { ascending: true });

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }

    let branches: StockFilterOptions["branches"] = [];
    if (ctx.branchScope) {
      const row = branchesRes.data as {
        id: string;
        name: string;
        code: string;
      } | null;
      if (row) {
        branches = [row];
      }
    } else {
      branches = (branchesRes.data ?? []) as StockFilterOptions["branches"];
    }

    const categories = Object.entries(PART_CATEGORY_LABELS).map(
      ([code, label]) => ({
        code: code as PartCategory,
        label,
      }),
    );

    return { branches, categories };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
