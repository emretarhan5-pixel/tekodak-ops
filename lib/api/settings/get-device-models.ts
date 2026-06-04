"use server";

import {
  getSettingsApiContext,
} from "@/lib/api/settings/auth";
import { SettingsApiError } from "@/lib/api/settings/auth.types";
import {
  assertSettingsAdmin,
  toSettingsError,
} from "@/lib/api/settings/settings-helpers";
import type { BrandOption, DeviceModelListItem } from "@/lib/api/settings/types";

export async function getDeviceModelsSettings(
  brandId?: string,
): Promise<{ models: DeviceModelListItem[]; brands: BrandOption[] }> {
  try {
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const [brandsRes, modelsRes] = await Promise.all([
      ctx.supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      (() => {
        let query = ctx.supabase
          .from("device_models")
          .select(
            `
            id,
            brand_id,
            model_name,
            display_order,
            is_active,
            brands!device_models_brand_id_fkey ( name )
          `,
          )
          .order("display_order", { ascending: true })
          .order("model_name", { ascending: true });

        if (brandId) {
          query = query.eq("brand_id", brandId);
        }

        return query;
      })(),
    ]);

    if (brandsRes.error) {
      throw new Error(brandsRes.error.message);
    }
    if (modelsRes.error) {
      throw new Error(modelsRes.error.message);
    }

    const models = (modelsRes.data ?? []).map((row) => {
      const brand = row.brands as { name: string } | null;
      return {
        id: row.id,
        brand_id: row.brand_id,
        brand_name: brand?.name ?? "—",
        model_name: row.model_name,
        display_order: Number(row.display_order ?? 0),
        is_active: row.is_active ?? true,
      };
    });

    return {
      brands: (brandsRes.data ?? []).map((b) => ({ id: b.id, name: b.name })),
      models,
    };
  } catch (error) {
    if (error instanceof SettingsApiError) {
      throw error;
    }
    throw new Error(toSettingsError(error));
  }
}
