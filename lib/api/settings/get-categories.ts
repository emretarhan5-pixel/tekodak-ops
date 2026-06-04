"use server";

import {
  getSettingsApiContext,
} from "@/lib/api/settings/auth";
import { SettingsApiError } from "@/lib/api/settings/auth.types";
import {
  assertSettingsAdmin,
  toSettingsError,
} from "@/lib/api/settings/settings-helpers";
import type { CategoryListItem } from "@/lib/api/settings/types";

export async function getCategories(
  categoryType: "contract_type" | "part_category",
): Promise<CategoryListItem[]> {
  try {
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const { data, error } = await ctx.supabase
      .from("categories")
      .select(
        "id, category_type, code, display_name, description, display_order, is_active, is_system",
      )
      .eq("category_type", categoryType)
      .order("display_order", { ascending: true })
      .order("display_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      category_type: row.category_type as CategoryListItem["category_type"],
      code: row.code,
      display_name: row.display_name,
      description: row.description,
      display_order: Number(row.display_order ?? 0),
      is_active: row.is_active ?? true,
      is_system: row.is_system ?? false,
    }));
  } catch (error) {
    if (error instanceof SettingsApiError) {
      throw error;
    }
    throw new Error(toSettingsError(error));
  }
}
