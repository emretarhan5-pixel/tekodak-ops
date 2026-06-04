"use server";

import {
  getReportApiContext,
  resolveBranchFilter,
  ReportApiError,
  toActionError,
} from "@/lib/api/reports/auth";
import { fetchContractReportData } from "@/lib/api/reports/contract-report-data";
import type { ContractReportData } from "@/lib/api/reports/types";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function getContractReport(
  rawFilters: ReportFilterInput,
): Promise<ContractReportData> {
  try {
    const filters = reportFilterSchema.parse(rawFilters);
    const ctx = await getReportApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    return fetchContractReportData(ctx.supabase, filters, branchId);
  } catch (error) {
    if (error instanceof ReportApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
