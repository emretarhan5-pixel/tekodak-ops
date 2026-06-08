"use server";

import {
  getServiceRequestApiContext,
  resolveBranchFilter,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import type { ServiceRequestFilterOptions } from "@/lib/api/service-requests/types";

export async function getServiceRequestFilterOptions(): Promise<ServiceRequestFilterOptions> {
  try {
    const ctx = await getServiceRequestApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    const [branchesRes, usersRes] = await Promise.all([
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
      (() => {
        let q = ctx.supabase
          .from("users")
          .select("id, full_name")
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("full_name", { ascending: true });
        if (branchFilter) {
          q = q.eq("branch_id", branchFilter);
        }
        return q;
      })(),
    ]);

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (usersRes.error) {
      throw new Error(usersRes.error.message);
    }

    let branches: ServiceRequestFilterOptions["branches"] = [];
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
      branches = (branchesRes.data ??
        []) as ServiceRequestFilterOptions["branches"];
    }

    return {
      branches,
      technicians: (usersRes.data ??
        []) as ServiceRequestFilterOptions["technicians"],
    };
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
