"use server";

import {
  getReportApiContext,
  resolveBranchFilter,
  ReportApiError,
  toActionError,
} from "@/lib/api/reports/auth";
import { fetchStockReportData } from "@/lib/api/reports/stock-report-data";
import type { StockReportData } from "@/lib/api/reports/types";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function getStockReport(
  rawFilters: ReportFilterInput,
): Promise<StockReportData> {
  try {
    const filters = reportFilterSchema.parse(rawFilters);
    const ctx = await getReportApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    return fetchStockReportData(ctx.supabase, filters, branchId);
  } catch (error) {
    if (error instanceof ReportApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
