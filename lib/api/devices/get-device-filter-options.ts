"use server";

import {
  DeviceApiError,
  getDeviceApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/devices/auth";
import type { DeviceFilterOptions } from "@/lib/api/devices/types";

export async function getDeviceFilterOptions(): Promise<DeviceFilterOptions> {
  try {
    const ctx = await getDeviceApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    const [branchesRes, brandsRes, customersRes] = await Promise.all([
      ctx.branchScope
        ? ctx.supabase
            .from("branches")
            .select("id, name, code")
            .eq("id", ctx.branchScope)
            .maybeSingle()
        : ctx.supabase
            .from("branches")
            .select("id, name, code")
            .order("name", { ascending: true }),
      ctx.supabase
        .from("brands")
        .select("id, name")
        .order("name", { ascending: true }),
      (() => {
        let q = ctx.supabase
          .from("customers")
          .select("id, name")
          .is("deleted_at", null)
          .order("name", { ascending: true })
          .limit(2000);
        if (branchFilter) {
          q = q.eq("branch_id", branchFilter);
        }
        return q;
      })(),
    ]);

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (brandsRes.error) {
      throw new Error(brandsRes.error.message);
    }
    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }

    let branches: DeviceFilterOptions["branches"] = [];
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
      branches = (branchesRes.data ?? []) as DeviceFilterOptions["branches"];
    }

    return {
      branches,
      brands: (brandsRes.data ?? []) as DeviceFilterOptions["brands"],
      customers: (customersRes.data ?? []) as DeviceFilterOptions["customers"],
    };
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
