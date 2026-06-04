import { reportFilterSchema } from "@/schemas/report";

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseReportSearchParams(
  params: Record<string, SearchParamValue>,
) {
  return reportFilterSchema.parse({
    type: first(params.type),
    period: first(params.period),
    dateFrom: first(params.dateFrom),
    dateTo: first(params.dateTo),
    branchId: first(params.branchId),
  });
}
