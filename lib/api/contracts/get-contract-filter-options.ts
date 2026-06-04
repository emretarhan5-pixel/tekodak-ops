"use server";

import {
  ContractApiError,
  getContractApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ContractFilterOptions } from "@/lib/api/contracts/types";

export async function getContractFilterOptions(): Promise<ContractFilterOptions> {
  try {
    const ctx = await getContractApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    const [branchesRes, customersRes] = await Promise.all([
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
    ]);

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }

    let branches: ContractFilterOptions["branches"] = [];
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
      branches = (branchesRes.data ?? []) as ContractFilterOptions["branches"];
    }

    return {
      branches,
      customers: (customersRes.data ?? []) as ContractFilterOptions["customers"],
    };
  } catch (error) {
    if (error instanceof ContractApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
