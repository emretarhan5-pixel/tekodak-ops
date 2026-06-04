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
import {
  fetchStockReportData,
  stockReportToCsvRows,
} from "@/lib/api/reports/stock-report-data";
import type { ActionResult, ReportExportResult } from "@/lib/api/reports/types";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas/report";

export async function exportStockReport(
  rawFilters: ReportFilterInput,
): Promise<ActionResult<ReportExportResult>> {
  try {
    const filters = reportFilterSchema.parse(rawFilters);
    const ctx = await getReportApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);
    const data = await fetchStockReportData(ctx.supabase, filters, branchId);
    const { contentBase64, mimeType } = buildCsvBase64(
      stockReportToCsvRows(data),
    );

    return {
      success: true,
      data: {
        contentBase64,
        mimeType,
        filename: reportExportFilename("stok-raporu"),
        recordCount: data.rows.length,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
