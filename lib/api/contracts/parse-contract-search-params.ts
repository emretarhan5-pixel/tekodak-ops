import { contractFilterSchema } from "@/schemas/contract";

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseContractSearchParams(
  params: Record<string, SearchParamValue>,
) {
  return contractFilterSchema.parse({
    search: first(params.search),
    branchId: first(params.branchId),
    customerId: first(params.customerId),
    status: first(params.status),
    renewalBadge: first(params.renewalBadge),
    listFilter: first(params.listFilter),
    dateFrom: first(params.dateFrom),
    dateTo: first(params.dateTo),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });
}
