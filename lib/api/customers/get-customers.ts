"use server";

import {
  getCustomerApiContext,
  resolveBranchFilter,
  CustomerApiError,
  toActionError,
} from "@/lib/api/customers/auth";
import {
  applyCustomerListFilters,
  fetchFilteredCustomerRows,
  mapAllCustomerRows,
} from "@/lib/api/customers/query-customer-list";
import type { CustomerListResult } from "@/lib/api/customers/types";
import { customerFilterSchema, type CustomerFilterInput } from "@/schemas/customer";

export async function getCustomers(
  rawFilters: CustomerFilterInput,
): Promise<CustomerListResult> {
  try {
    const filters = customerFilterSchema.parse(rawFilters);
    const ctx = await getCustomerApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    const rawRows = await fetchFilteredCustomerRows(ctx, filters, branchId);
    const mapped = applyCustomerListFilters(
      rawRows,
      mapAllCustomerRows(rawRows, ctx.user.id),
      filters,
    );

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
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
