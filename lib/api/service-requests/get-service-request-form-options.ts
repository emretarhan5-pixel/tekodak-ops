"use server";

import {
  getServiceRequestApiContext,
  resolveBranchFilter,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import type { ServiceRequestFormOptions } from "@/lib/api/service-requests/types";

type RawDeviceModelRow = {
  id: string;
  model_name: string;
  brands: { name: string } | null;
};

export async function getServiceRequestFormOptions(): Promise<ServiceRequestFormOptions> {
  try {
    const ctx = await getServiceRequestApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    let customersQuery = ctx.supabase
      .from("customers")
      .select("id, name, branch_id")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(2000);

    if (branchFilter) {
      customersQuery = customersQuery.eq("branch_id", branchFilter);
    }

    const branchesPromise = ctx.permissions.isAdmin
      ? ctx.supabase
          .from("branches")
          .select("id, name, code")
          .order("name", { ascending: true })
      : ctx.supabase
          .from("branches")
          .select("id, name, code")
          .eq("id", ctx.branchScope ?? "")
          .maybeSingle();

    const modelsPromise = ctx.supabase
      .from("device_models")
      .select(
        `
        id,
        model_name,
        brands!device_models_brand_id_fkey ( name )
      `,
      )
      .eq("is_active", true)
      .order("model_name", { ascending: true })
      .limit(2000);

    const [branchesRes, modelsRes, customersRes] = await Promise.all([
      branchesPromise,
      modelsPromise,
      customersQuery,
    ]);

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (modelsRes.error) {
      throw new Error(modelsRes.error.message);
    }
    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }

    let branches: ServiceRequestFormOptions["branches"] = [];
    if (ctx.permissions.isAdmin) {
      branches = (branchesRes.data ??
        []) as ServiceRequestFormOptions["branches"];
    } else {
      const row = branchesRes.data as {
        id: string;
        name: string;
        code: string;
      } | null;
      if (row) {
        branches = [row];
      }
    }

    const device_models = ((modelsRes.data ?? []) as unknown as RawDeviceModelRow[]).map(
      (model) => {
        const brandName = model.brands?.name ?? "";
        const label = [brandName, model.model_name].filter(Boolean).join(" · ");
        return {
          id: model.id,
          label,
          brand_name: brandName,
          model_name: model.model_name,
        };
      },
    );

    return {
      branches,
      customers: (customersRes.data ??
        []) as ServiceRequestFormOptions["customers"],
      device_models,
    };
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
