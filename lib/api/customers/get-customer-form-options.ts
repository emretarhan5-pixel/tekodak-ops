"use server";

import {
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { BranchOption, SectorOption } from "@/lib/api/customers/get-customer-filter-options";

export type StaffUserOption = {
  id: string;
  full_name: string;
  email: string;
  branch_id: string | null;
};

export type CustomerFormOptions = {
  branches: BranchOption[];
  sectors: SectorOption[];
  users: StaffUserOption[];
};

export async function getCustomerFormOptions(): Promise<CustomerFormOptions> {
  try {
    const ctx = await getCustomerApiContext();

    const [branchesResult, sectorsResult, usersResult] = await Promise.all([
      ctx.supabase
        .from("branches")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name"),
      ctx.supabase
        .from("categories")
        .select("code, display_name")
        .eq("category_type", "customer_sector")
        .eq("is_active", true)
        .order("display_order"),
      ctx.supabase
        .from("users")
        .select("id, full_name, email, branch_id")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("full_name"),
    ]);

    if (branchesResult.error) {
      throw new Error(branchesResult.error.message);
    }
    if (sectorsResult.error) {
      throw new Error(sectorsResult.error.message);
    }
    if (usersResult.error) {
      throw new Error(usersResult.error.message);
    }

    let branches = (branchesResult.data ?? []) as BranchOption[];

    if (ctx.branchScope) {
      branches = branches.filter((b) => b.id === ctx.branchScope);
    }

    return {
      branches,
      sectors: (sectorsResult.data ?? []) as SectorOption[],
      users: (usersResult.data ?? []) as StaffUserOption[],
    };
  } catch (error) {
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
