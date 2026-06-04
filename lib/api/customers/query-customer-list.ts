import {
  filterCustomerIdsByContractBadge,
  worstContractBadge,
} from "@/lib/api/customers/contract-status";
import type { CustomerApiContext } from "@/lib/api/customers/auth";
import type { CustomerListItem } from "@/lib/api/customers/types";
import type { CustomerType } from "@/lib/constants/customer";
import type { CustomerFilterInput } from "@/schemas/customer";

export const CUSTOMER_LIST_SELECT = `
  id,
  name,
  tax_number,
  customer_type,
  sector,
  main_phone,
  email,
  city,
  branch_id,
  branches!inner (
    name,
    code
  ),
  customer_responsible_users (
    is_primary,
    user:users!customer_responsible_users_user_id_fkey (
      full_name
    )
  ),
  customer_pins (
    user_id
  ),
  contracts (
    status,
    end_date
  )
`;

export type RawCustomerListRow = {
  id: string;
  name: string;
  tax_number: string;
  customer_type: CustomerType;
  sector: string | null;
  main_phone: string;
  email: string | null;
  city: string;
  branch_id: string;
  branches: { name: string; code: string };
  customer_responsible_users: Array<{
    is_primary: boolean;
    user: { full_name: string } | null;
  }>;
  customer_pins: Array<{ user_id: string }>;
  contracts: Array<{ status: string; end_date: string }>;
};

export function mapCustomerListRow(
  row: RawCustomerListRow,
  userId: string,
): CustomerListItem {
  const activeContracts = (row.contracts ?? []).filter(
    (c) => !["cancelled", "renewed"].includes(c.status),
  );

  const responsible = (row.customer_responsible_users ?? [])
    .map((r) => r.user?.full_name)
    .filter((n): n is string => Boolean(n));

  return {
    id: row.id,
    name: row.name,
    tax_number: row.tax_number,
    customer_type: row.customer_type,
    sector: row.sector,
    main_phone: row.main_phone,
    email: row.email,
    city: row.city,
    branch_id: row.branch_id,
    branch_name: row.branches.name,
    branch_code: row.branches.code,
    contract_badge: worstContractBadge(activeContracts),
    responsible_names: responsible,
    is_pinned: (row.customer_pins ?? []).some((p) => p.user_id === userId),
  };
}

export async function fetchFilteredCustomerRows(
  ctx: CustomerApiContext,
  filters: CustomerFilterInput,
  branchId: string | undefined,
): Promise<RawCustomerListRow[]> {
  let query = ctx.supabase
    .from("customers")
    .select(CUSTOMER_LIST_SELECT)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  if (filters.sector) {
    query = query.eq("sector", filters.sector);
  }

  if (filters.customerType) {
    query = query.eq("customer_type", filters.customerType);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/%/g, "\\%");
    query = query.or(`name.ilike.%${term}%,tax_number.ilike.%${term}%`);
  }

  const { data: rows, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (rows ?? []) as unknown as RawCustomerListRow[];
}

export function applyCustomerListFilters(
  rawRows: RawCustomerListRow[],
  mapped: CustomerListItem[],
  filters: CustomerFilterInput,
): CustomerListItem[] {
  let result = mapped;

  if (filters.contractStatus) {
    const contractsByCustomer = new Map<
      string,
      Array<{ status: string; end_date: string }>
    >();
    for (const row of rawRows) {
      const active = (row.contracts ?? []).filter(
        (c) => !["cancelled", "renewed"].includes(c.status),
      );
      contractsByCustomer.set(row.id, active);
    }

    if (filters.contractStatus === "none") {
      result = result.filter((c) => c.contract_badge === "none");
    } else {
      const allowed = filterCustomerIdsByContractBadge(
        contractsByCustomer,
        filters.contractStatus,
      );
      result = result.filter((c) => allowed.has(c.id));
    }
  }

  result.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "tr");
  });

  return result;
}

export function mapAllCustomerRows(
  rawRows: RawCustomerListRow[],
  userId: string,
): CustomerListItem[] {
  return rawRows.map((row) => mapCustomerListRow(row, userId));
}
