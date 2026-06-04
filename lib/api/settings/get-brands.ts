"use server";

import {
  getSettingsApiContext,
} from "@/lib/api/settings/auth";
import { SettingsApiError } from "@/lib/api/settings/auth.types";
import {
  assertSettingsAdmin,
  toSettingsError,
} from "@/lib/api/settings/settings-helpers";
import type { BrandListItem } from "@/lib/api/settings/types";

export async function getBrands(): Promise<BrandListItem[]> {
  try {
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const { data, error } = await ctx.supabase
      .from("brands")
      .select(
        "id, name, default_warranty_years, display_order, description, is_active",
      )
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      default_warranty_years: Number(row.default_warranty_years ?? 0),
      display_order: Number(row.display_order ?? 0),
      description: row.description,
      is_active: row.is_active ?? true,
    }));
  } catch (error) {
    if (error instanceof SettingsApiError) {
      throw error;
    }
    throw new Error(toSettingsError(error));
  }
}
