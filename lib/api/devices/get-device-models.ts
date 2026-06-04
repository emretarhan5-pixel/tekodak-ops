"use server";

import {
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { BrandOption, DeviceModelOption } from "@/lib/api/devices/types";

export async function getDeviceModelsForBrand(
  brandId: string,
): Promise<DeviceModelOption[]> {
  try {
    const ctx = await getDeviceApiContext();

    const { data: brand, error: brandError } = await ctx.supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError) {
      throw new Error(brandError.message);
    }

    if (!brand) {
      throw new DeviceApiError("Marka bulunamadı", "NOT_FOUND");
    }

    const { data, error } = await ctx.supabase
      .from("device_models")
      .select("id, brand_id, model_name")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .order("model_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      brand_id: row.brand_id,
      name: row.model_name,
    }));
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

export async function getBrandsForDeviceForm(): Promise<BrandOption[]> {
  try {
    const ctx = await getDeviceApiContext();

    const { data, error } = await ctx.supabase
      .from("brands")
      .select("id, name, default_warranty_years")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as BrandOption[];
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
