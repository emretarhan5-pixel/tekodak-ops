"use server";

import {
  getReportApiContext,
  resolveBranchFilter,
  ReportApiError,
  toActionError,
} from "@/lib/api/reports/auth";
import { fetchCustomerReportData } from "@/lib/api/reports/customer-report-data";
import type { CustomerReportData } from "@/lib/api/reports/types";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function getCustomerReport(
  rawFilters: ReportFilterInput,
): Promise<CustomerReportData> {
  try {
    const filters = reportFilterSchema.parse(rawFilters);
    const ctx = await getReportApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    return fetchCustomerReportData(ctx.supabase, filters, branchId);
  } catch (error) {
    if (error instanceof ReportApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
