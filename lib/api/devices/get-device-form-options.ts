"use server";

import {
  DeviceApiError,
  getDeviceApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/devices/auth";
import type { BrandOption, DeviceModelOption } from "@/lib/api/devices/types";

export type DeviceFormCustomerOption = {
  id: string;
  name: string;
};

export type DeviceFormOptions = {
  customers: DeviceFormCustomerOption[];
  brands: BrandOption[];
  models: DeviceModelOption[];
};

export async function getDeviceFormOptions(): Promise<DeviceFormOptions> {
  try {
    const ctx = await getDeviceApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    let customersQuery = ctx.supabase
      .from("customers")
      .select("id, name")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(2000);

    if (branchFilter) {
      customersQuery = customersQuery.eq("branch_id", branchFilter);
    }

    const [customersRes, brandsRes, modelsRes] = await Promise.all([
      customersQuery,
      ctx.supabase
        .from("brands")
        .select("id, name, default_warranty_years")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      ctx.supabase
        .from("device_models")
        .select("id, brand_id, model_name")
        .eq("is_active", true)
        .order("model_name", { ascending: true }),
    ]);

    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }
    if (brandsRes.error) {
      throw new Error(brandsRes.error.message);
    }
    if (modelsRes.error) {
      throw new Error(modelsRes.error.message);
    }

    return {
      customers: (customersRes.data ?? []) as DeviceFormCustomerOption[],
      brands: (brandsRes.data ?? []) as BrandOption[],
      models: (modelsRes.data ?? []).map((row) => ({
        id: row.id,
        brand_id: row.brand_id,
        name: row.model_name,
      })),
    };
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
