"use server";

import {
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";

export type BranchOption = {
  id: string;
  name: string;
  code: string;
};

export type SectorOption = {
  code: string;
  display_name: string;
};

export type CustomerFilterOptions = {
  branches: BranchOption[];
  sectors: SectorOption[];
};

export async function getCustomerFilterOptions(): Promise<CustomerFilterOptions> {
  try {
    const ctx = await getCustomerApiContext();

    const [branchesResult, sectorsResult] = await Promise.all([
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
    ]);

    if (branchesResult.error) {
      throw new Error(branchesResult.error.message);
    }
    if (sectorsResult.error) {
      throw new Error(sectorsResult.error.message);
    }

    return {
      branches: (branchesResult.data ?? []) as BranchOption[],
      sectors: (sectorsResult.data ?? []) as SectorOption[],
    };
  } catch (error) {
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
