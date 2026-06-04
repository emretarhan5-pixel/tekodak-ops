"use server";

import {
  getStockApiContext,
  resolveBranchFilter,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import type {
  StockFormBranchOption,
  StockFormBrandOption,
  StockFormCategoryOption,
  StockFormOptions,
} from "@/lib/api/stock/types";
import { PART_CATEGORIES, type PartCategory } from "@/lib/constants/stock-item";

export async function getStockFormOptions(): Promise<StockFormOptions> {
  try {
    const ctx = await getStockApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    const [categoriesRes, branchesRes, brandsRes] = await Promise.all([
      ctx.supabase
        .from("categories")
        .select("code, display_name, display_order")
        .eq("category_type", "part_category")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("display_name", { ascending: true }),
      ctx.branchScope
        ? ctx.supabase
            .from("branches")
            .select("id, name, code")
            .eq("id", ctx.branchScope)
            .eq("is_active", true)
            .maybeSingle()
        : ctx.supabase
            .from("branches")
            .select("id, name, code")
            .eq("is_active", true)
            .order("name", { ascending: true }),
      ctx.supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    if (categoriesRes.error) {
      throw new Error(categoriesRes.error.message);
    }
    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (brandsRes.error) {
      throw new Error(brandsRes.error.message);
    }

    const allowedCategories = new Set<string>(PART_CATEGORIES);
    const categories: StockFormCategoryOption[] = (categoriesRes.data ?? [])
      .filter((row) => allowedCategories.has(row.code))
      .map((row) => ({
        code: row.code as PartCategory,
        label: row.display_name,
      }));

    let branches: StockFormBranchOption[] = [];
    if (ctx.branchScope) {
      const row = branchesRes.data as StockFormBranchOption | null;
      if (row) {
        branches = [row];
      }
    } else {
      branches = (branchesRes.data ?? []) as StockFormBranchOption[];
    }

    void branchFilter;

    return {
      categories,
      branches,
      brands: (brandsRes.data ?? []) as StockFormBrandOption[],
      defaultBranchId: ctx.branchScope,
    };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
