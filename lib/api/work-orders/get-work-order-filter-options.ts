"use server";

import {
  getWorkOrderApiContext,
  resolveBranchFilter,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { WorkOrderFilterOptions } from "@/lib/api/work-orders/types";

export async function getWorkOrderFilterOptions(): Promise<WorkOrderFilterOptions> {
  try {
    const ctx = await getWorkOrderApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    const [branchesRes, customersRes, usersRes] = await Promise.all([
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
    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }
    if (usersRes.error) {
      throw new Error(usersRes.error.message);
    }

    let branches: WorkOrderFilterOptions["branches"] = [];
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
        []) as WorkOrderFilterOptions["branches"];
    }

    return {
      branches,
      customers: (customersRes.data ??
        []) as WorkOrderFilterOptions["customers"],
      assignees: (usersRes.data ?? []) as WorkOrderFilterOptions["assignees"],
    };
  } catch (error) {
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
