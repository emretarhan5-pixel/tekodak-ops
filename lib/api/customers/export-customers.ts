"use server";

import { headers } from "next/headers";
import ExcelJS from "exceljs";

import {
  assertCanExport,
  getCustomerApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/customers/auth";
import {
  applyCustomerListFilters,
  fetchFilteredCustomerRows,
  mapAllCustomerRows,
} from "@/lib/api/customers/query-customer-list";
import type { Database } from "@/lib/supabase/types";
import type {
  ActionResult,
  ExportCustomersFormat,
  ExportCustomersResult,
} from "@/lib/api/customers/types";
import { CONTRACT_BADGE_CONFIG } from "@/lib/constants/customer-contract-status";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants/customer";
import {
  customerFilterSchema,
  type CustomerFilterInput,
} from "@/schemas/customer";
import { formatTurkishPhoneDisplay } from "@/lib/utils/phone";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function filtersForExportLog(filters: CustomerFilterInput): Record<string, unknown> {
  return {
    search: filters.search ?? null,
    branchId: filters.branchId ?? null,
    sector: filters.sector ?? null,
    customerType: filters.customerType ?? null,
    contractStatus: filters.contractStatus ?? null,
  };
}

export async function exportCustomers(
  rawFilters: CustomerFilterInput,
  format: ExportCustomersFormat,
): Promise<ActionResult<ExportCustomersResult>> {
  try {
    const filters = customerFilterSchema.parse({
      ...rawFilters,
      page: 1,
      pageSize: 100_000,
    });
    const ctx = await getCustomerApiContext();
    assertCanExport(ctx);

    const branchId = resolveBranchFilter(ctx, filters.branchId);
    const rawRows = await fetchFilteredCustomerRows(ctx, filters, branchId);
    const customers = applyCustomerListFilters(
      rawRows,
      mapAllCustomerRows(rawRows, ctx.user.id),
      filters,
    );

    const headersRow = [
      "Kurum Adı",
      "Vergi No",
      "Müşteri Tipi",
      "Sektör",
      "İl",
      "Şube",
      "Ana Telefon",
      "E-posta",
      "Sözleşme Durumu",
      "Sorumlu Personel",
    ];

    const dataRows = customers.map((c) => [
      c.name,
      c.tax_number,
      CUSTOMER_TYPE_LABELS[c.customer_type],
      c.sector ?? "",
      c.city,
      `${c.branch_name} (${c.branch_code})`,
      formatTurkishPhoneDisplay(c.main_phone),
      c.email ?? "",
      CONTRACT_BADGE_CONFIG[c.contract_badge].label,
      c.responsible_names.join(", "),
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    let contentBase64: string;
    let filename: string;
    let mimeType: string;

    if (format === "csv") {
      const csv = buildCsv([headersRow, ...dataRows]);
      const bom = "\uFEFF";
      contentBase64 = Buffer.from(bom + csv, "utf-8").toString("base64");
      filename = `musteriler-${stamp}.csv`;
      mimeType = "text/csv;charset=utf-8";
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Müşteriler");
      sheet.addRow(headersRow);
      for (const row of dataRows) {
        sheet.addRow(row);
      }
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach((col) => {
        col.width = 18;
      });
      const buffer = await workbook.xlsx.writeBuffer();
      contentBase64 = Buffer.from(buffer).toString("base64");
      filename = `musteriler-${stamp}.xlsx`;
      mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    const fileSizeBytes = Buffer.from(contentBase64, "base64").length;

    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() ?? null;

    const { error: exportLogError } = await ctx.supabase.from("data_exports").insert({
      user_id: ctx.user.id,
      export_type: "customers",
      format,
      filters_applied: filtersForExportLog(
        filters,
      ) as Database["public"]["Tables"]["data_exports"]["Insert"]["filters_applied"],
      record_count: customers.length,
      file_size_bytes: fileSizeBytes,
      ip_address: ipAddress,
    });

    if (exportLogError) {
      throw new Error(exportLogError.message);
    }

    return {
      success: true,
      data: {
        filename,
        mimeType,
        contentBase64,
        recordCount: customers.length,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
