"use server";

import {
  getReportApiContext,
  resolveBranchFilter,
  ReportApiError,
  toActionError,
} from "@/lib/api/reports/auth";
import { fetchWorkOrderReportData } from "@/lib/api/reports/work-order-report-data";
import type { WorkOrderReportData } from "@/lib/api/reports/types";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function getWorkOrderReport(
  rawFilters: ReportFilterInput,
): Promise<WorkOrderReportData> {
  try {
    const filters = reportFilterSchema.parse(rawFilters);
    const ctx = await getReportApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    return fetchWorkOrderReportData(ctx.supabase, filters, branchId);
  } catch (error) {
    if (error instanceof ReportApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
