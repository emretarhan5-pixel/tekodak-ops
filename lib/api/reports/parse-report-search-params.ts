import { reportFilterSchema } from "@/schemas/report";

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === "") {
    return undefined;
  }
  return raw;
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
