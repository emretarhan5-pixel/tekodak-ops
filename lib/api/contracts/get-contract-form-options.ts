"use server";

import {
  ContractApiError,
  getContractApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/contracts/auth";

export type ContractFormCustomerOption = {
  id: string;
  name: string;
};

export type ContractFormOptions = {
  customers: ContractFormCustomerOption[];
};

export async function getContractFormOptions(): Promise<ContractFormOptions> {
  try {
    const ctx = await getContractApiContext();
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

    const customersRes = await customersQuery;

    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }

    const customers = (customersRes.data ??
      []) as ContractFormCustomerOption[];

    return { customers };
  } catch (error) {
    if (error instanceof ContractApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
