"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import { ExportButton } from "@/components/reports/ExportButton";
import { ReportDataTable } from "@/components/reports/report-data-table";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContractReportData } from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type ContractReportProps = {
  data: ContractReportData;
  filters: ReportFilterInput;
};

function formatMoney(value: number, currency: "TRY" | "EUR"): string {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return currency === "EUR" ? `${formatted} €` : `${formatted} ₺`;
}

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

export function ContractReport({ data, filters }: ContractReportProps) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{data.period.label}</p>
        <ExportButton reportType="contracts" filters={filters} />
      </div>

      <ReportSummaryCards
        items={[
          {
            label: "Aktif Sözleşme",
            value: summary.activeCount.toLocaleString("tr-TR"),
            hint: `${formatMoney(summary.activeAmountTry, "TRY")} · ${formatMoney(summary.activeAmountEur, "EUR")}`,
          },
          {
            label: "Yeni Sözleşme",
            value: summary.newCount.toLocaleString("tr-TR"),
            hint: `${formatMoney(summary.newAmountTry, "TRY")} · ${formatMoney(summary.newAmountEur, "EUR")}`,
          },
          {
            label: "Yenilenen",
            value: summary.renewedCount.toLocaleString("tr-TR"),
          },
          {
            label: "Biten / İptal",
            value: summary.endedCount.toLocaleString("tr-TR"),
          },
          {
            label: "Yenileme Oranı",
            value:
              summary.renewalRate != null
                ? `%${summary.renewalRate.toLocaleString("tr-TR")}`
                : "—",
          },
        ]}
        columns={3}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sözleşme Detayı</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportDataTable
            rows={data.rows}
            searchPlaceholder="Müşteri veya sözleşme no ara…"
            columns={[
              {
                id: "customer",
                header: "Müşteri",
                searchValue: (row) => row.customer_name,
                cell: (row) => row.customer_name,
              },
              {
                id: "number",
                header: "Sözleşme No",
                searchValue: (row) => row.contract_number,
                cell: (row) => (
                  <span className="font-mono text-sm">{row.contract_number}</span>
                ),
              },
              {
                id: "amount",
                header: "Tutar",
                cell: (row) =>
                  formatMoney(
                    row.amount,
                    row.currency === "EUR" ? "EUR" : "TRY",
                  ),
              },
              {
                id: "start",
                header: "Başlangıç",
                cell: (row) => formatDate(row.start_date),
              },
              {
                id: "end",
                header: "Bitiş",
                cell: (row) => formatDate(row.end_date),
              },
              {
                id: "status",
                header: "Durum",
                cell: (row) => row.status_label,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
