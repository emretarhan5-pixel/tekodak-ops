import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { CONTRACT_STATUS_LABELS } from "@/lib/constants/contract";
import type { ContractStatus } from "@/lib/constants/contract";
import {
  isDateInPeriod,
  resolveReportPeriod,
} from "@/lib/api/reports/report-period";
import type {
  ContractReportData,
  ContractReportRow,
  ContractReportSummary,
} from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type RawContractRow = {
  contract_number: string;
  start_date: string;
  end_date: string;
  agreed_price: number;
  currency: string | null;
  status: ContractStatus;
  renewed_from_id: string | null;
  customers: { name: string } | null;
};

function sumByCurrency(
  rows: RawContractRow[],
  currency: "TRY" | "EUR",
): number {
  return rows
    .filter((row) => (row.currency ?? "TRY") === currency)
    .reduce((sum, row) => sum + Number(row.agreed_price ?? 0), 0);
}

function buildSummary(
  rows: RawContractRow[],
  period: ReturnType<typeof resolveReportPeriod>,
): ContractReportSummary {
  const activeRows = rows.filter((row) => row.status === "active");
  const newRows = rows.filter((row) => isDateInPeriod(row.start_date, period));
  const renewedRows = rows.filter(
    (row) =>
      isDateInPeriod(row.start_date, period) &&
      (row.status === "renewed" || row.renewed_from_id != null),
  );
  const endedRows = rows.filter(
    (row) =>
      isDateInPeriod(row.end_date, period) &&
      (row.status === "expired" || row.status === "cancelled"),
  );

  const expiredInPeriod = rows.filter(
    (row) => row.status === "expired" && isDateInPeriod(row.end_date, period),
  );
  const renewedForRate = renewedRows.length;
  const expiredForRate = expiredInPeriod.length;
  const renewalRate =
    renewedForRate + expiredForRate > 0
      ? Math.round((renewedForRate / (renewedForRate + expiredForRate)) * 1000) /
        10
      : null;

  return {
    activeCount: activeRows.length,
    activeAmountTry: sumByCurrency(activeRows, "TRY"),
    activeAmountEur: sumByCurrency(activeRows, "EUR"),
    newCount: newRows.length,
    newAmountTry: sumByCurrency(newRows, "TRY"),
    newAmountEur: sumByCurrency(newRows, "EUR"),
    renewedCount: renewedRows.length,
    endedCount: endedRows.length,
    renewalRate,
  };
}

function mapRows(rows: RawContractRow[]): ContractReportRow[] {
  return rows
    .map((row) => ({
      customer_name: row.customers?.name ?? "—",
      contract_number: row.contract_number,
      amount: Number(row.agreed_price ?? 0),
      currency: row.currency ?? "TRY",
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      status_label: CONTRACT_STATUS_LABELS[row.status],
    }))
    .sort((a, b) => a.end_date.localeCompare(b.end_date));
}

export async function fetchContractReportData(
  supabase: AppSupabaseClient,
  filters: ReportFilterInput,
  branchId?: string,
): Promise<ContractReportData> {
  const period = resolveReportPeriod(
    filters.period,
    filters.dateFrom,
    filters.dateTo,
  );

  let query = supabase
    .from("contracts")
    .select(
      `
      contract_number,
      start_date,
      end_date,
      agreed_price,
      currency,
      status,
      renewed_from_id,
      customers!contracts_customer_id_fkey ( name )
    `,
    )
    .is("deleted_at", null)
    .order("end_date", { ascending: true });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as RawContractRow[];

  return {
    summary: buildSummary(rows, period),
    rows: mapRows(rows),
    period,
  };
}

export function contractReportToCsvRows(
  data: ContractReportData,
): string[][] {
  return [
    [
      "Müşteri",
      "Sözleşme No",
      "Tutar",
      "Para Birimi",
      "Başlangıç",
      "Bitiş",
      "Durum",
    ],
    ...data.rows.map((row) => [
      row.customer_name,
      row.contract_number,
      row.amount.toLocaleString("tr-TR"),
      row.currency,
      row.start_date,
      row.end_date,
      row.status_label,
    ]),
  ];
}
