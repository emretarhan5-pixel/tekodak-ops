"use server";

import { getContractReport } from "@/lib/api/reports/get-contract-report";
import { getCustomerReport } from "@/lib/api/reports/get-customer-report";
import { getStockReport } from "@/lib/api/reports/get-stock-report";
import { getWorkOrderReport } from "@/lib/api/reports/get-work-order-report";
import type { ReportPageData } from "@/lib/api/reports/types";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function getReportPageData(
  rawFilters: ReportFilterInput,
): Promise<ReportPageData> {
  const filters = reportFilterSchema.parse(rawFilters);

  switch (filters.type) {
    case "work_orders":
      return {
        type: "work_orders",
        data: await getWorkOrderReport(filters),
      };
    case "stock":
      return { type: "stock", data: await getStockReport(filters) };
    case "customers":
      return { type: "customers", data: await getCustomerReport(filters) };
    case "contracts":
    default:
      return { type: "contracts", data: await getContractReport(filters) };
  }
}
