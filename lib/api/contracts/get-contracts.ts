"use server";

import {
  ContractApiError,
  getContractApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/contracts/auth";
import {
  computeContractRenewalBadge,
  computeDaysRemaining,
  matchesContractListFilter,
  renewalBadgeMatchesFilter,
} from "@/lib/api/contracts/contract-badge";
import type { ContractListItem, ContractListResult } from "@/lib/api/contracts/types";
import type {
  ContractCurrency,
  ContractStatus,
  ContractType,
} from "@/lib/constants/contract";
import { contractFilterSchema, type ContractFilterInput } from "@/schemas/contract";

const CONTRACT_LIST_SELECT = `
  id,
  contract_number,
  contract_type,
  start_date,
  end_date,
  status,
  agreed_price,
  currency,
  customer_id,
  branch_id,
  responsible_user_id,
  customers!contracts_customer_id_fkey!inner (
    id,
    name
  ),
  branches!contracts_branch_id_fkey!inner (
    name,
    code
  ),
  users!contracts_responsible_user_id_fkey (
    full_name
  )
`;

type RawContractRow = {
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
  responsible_user_id: string;
  customers: { id: string; name: string };
  branches: { name: string; code: string };
  users: { full_name: string } | null;
};

function mapRow(row: RawContractRow): ContractListItem {
  const status = row.status;
  const days_remaining = computeDaysRemaining(row.end_date);
  const renewal_badge = computeContractRenewalBadge(status, row.end_date);

  return {
    id: row.id,
    contract_number: row.contract_number,
    customer_id: row.customer_id,
    customer_name: row.customers.name,
    branch_id: row.branch_id,
    branch_name: row.branches.name,
    branch_code: row.branches.code,
    contract_type: row.contract_type,
    start_date: row.start_date,
    end_date: row.end_date,
    status,
    renewal_badge,
    days_remaining,
    agreed_price: row.agreed_price,
    currency: row.currency ?? "TRY",
    responsible_user_id: row.responsible_user_id,
    responsible_name: row.users?.full_name ?? "—",
  };
}

export async function getContracts(
  rawFilters: ContractFilterInput,
): Promise<ContractListResult> {
  try {
    const filters = contractFilterSchema.parse(rawFilters);
    const ctx = await getContractApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let query = ctx.supabase
      .from("contracts")
      .select(CONTRACT_LIST_SELECT)
      .is("deleted_at", null)
      .order("end_date", { ascending: true });

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (filters.customerId) {
      query = query.eq("customer_id", filters.customerId);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte("end_date", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("start_date", filters.dateTo);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, "\\%");
      query = query.or(
        `contract_number.ilike.%${term}%,customers.name.ilike.%${term}%`,
      );
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    let mapped = (rows as unknown as RawContractRow[]).map(mapRow);

    if (filters.listFilter) {
      mapped = mapped.filter((c) =>
        matchesContractListFilter(
          c.status,
          c.renewal_badge,
          filters.listFilter!,
        ),
      );
    } else if (filters.renewalBadge) {
      mapped = mapped.filter((c) =>
        renewalBadgeMatchesFilter(c.renewal_badge, filters.renewalBadge!),
      );
    }

    const total = mapped.length;
    const from = (filters.page - 1) * filters.pageSize;
    const data = mapped.slice(from, from + filters.pageSize);

    return {
      data,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  } catch (error) {
    if (error instanceof ContractApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
