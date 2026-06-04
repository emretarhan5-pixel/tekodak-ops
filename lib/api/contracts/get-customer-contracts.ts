"use server";

import {
  assertCanAccessBranch,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import {
  computeContractRenewalBadge,
  computeDaysRemaining,
} from "@/lib/api/contracts/contract-badge";
import type { CustomerContractListItem } from "@/lib/api/contracts/types";
import type {
  ContractCurrency,
  ContractStatus,
  ContractType,
} from "@/lib/constants/contract";

const CUSTOMER_CONTRACTS_SELECT = `
  id,
  contract_number,
  contract_type,
  start_date,
  end_date,
  status,
  agreed_price,
  currency,
  customer_id,
  branch_id
`;

type RawRow = {
  id: string;
  contract_number: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  agreed_price: number;
  currency: ContractCurrency;
  customer_id: string;
  branch_id: string;
};

export async function getCustomerContracts(
  customerId: string,
): Promise<CustomerContractListItem[]> {
  try {
    const ctx = await getContractApiContext();

    const { data: customer, error: custError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (custError) {
      throw new Error(custError.message);
    }

    if (!customer) {
      throw new ContractApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const { data, error } = await ctx.supabase
      .from("contracts")
      .select(CUSTOMER_CONTRACTS_SELECT)
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("end_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as RawRow[]).map((row) => {
      const status = row.status;
      const days_remaining = computeDaysRemaining(row.end_date);
      return {
        id: row.id,
        contract_number: row.contract_number,
        contract_type: row.contract_type,
        start_date: row.start_date,
        end_date: row.end_date,
        status,
        renewal_badge: computeContractRenewalBadge(status, row.end_date),
        days_remaining,
        agreed_price: row.agreed_price,
        currency: row.currency ?? "TRY",
      };
    });
  } catch (error) {
    if (error instanceof ContractApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
