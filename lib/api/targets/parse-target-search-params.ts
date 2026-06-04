import { targetFilterSchema } from "@/schemas/target";

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseTargetSearchParams(
  params: Record<string, SearchParamValue>,
) {
  return targetFilterSchema.parse({
    search: first(params.search),
    branchId: first(params.branchId),
    metricType: first(params.metricType),
    periodType: first(params.periodType),
    status: first(params.status),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });
}
