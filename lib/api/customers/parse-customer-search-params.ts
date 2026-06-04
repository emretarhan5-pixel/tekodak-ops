import {
  CONTRACT_STATUS_FILTERS,
  customerFilterSchema,
  type CustomerFilterInput,
} from "@/schemas/customer";
import { CUSTOMER_TYPES } from "@/lib/constants/customer";
import { DEFAULT_CUSTOMER_PAGE_SIZE } from "@/lib/constants/customer";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

export function parseCustomerSearchParams(
  params: Record<string, string | string[] | undefined>,
): CustomerFilterInput {
  const contractStatus = pickString(params, "contractStatus");
  const customerType = pickString(params, "customerType");

  return customerFilterSchema.parse({
    search: pickString(params, "search"),
    branchId: pickString(params, "branchId"),
    sector: pickString(params, "sector"),
    customerType:
      customerType &&
      (CUSTOMER_TYPES as readonly string[]).includes(customerType)
        ? customerType
        : undefined,
    contractStatus:
      contractStatus &&
      (CONTRACT_STATUS_FILTERS as readonly string[]).includes(contractStatus)
        ? contractStatus
        : undefined,
    page: pickString(params, "page") ?? "1",
    pageSize: pickString(params, "pageSize") ?? String(DEFAULT_CUSTOMER_PAGE_SIZE),
  });
}
