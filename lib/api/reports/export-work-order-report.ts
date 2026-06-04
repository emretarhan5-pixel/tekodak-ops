"use server";

import {
  getReportApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/reports/auth";
import {
  buildCsvBase64,
  reportExportFilename,
} from "@/lib/api/reports/csv-export";
import type { ActionResult, ReportExportResult } from "@/lib/api/reports/types";
import {
  fetchWorkOrderReportData,
  workOrderReportToCsvRows,
} from "@/lib/api/reports/work-order-report-data";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function exportWorkOrderReport(
  rawFilters: ReportFilterInput,
): Promise<ActionResult<ReportExportResult>> {
  try {
    const filters = reportFilterSchema.parse(rawFilters);
    const ctx = await getReportApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);
    const data = await fetchWorkOrderReportData(ctx.supabase, filters, branchId);
    const { contentBase64, mimeType } = buildCsvBase64(
      workOrderReportToCsvRows(data),
    );

    return {
      success: true,
      data: {
        contentBase64,
        mimeType,
        filename: reportExportFilename("is-emri-raporu"),
        recordCount: data.rows.length,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
