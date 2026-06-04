"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import { ExportButton } from "@/components/reports/ExportButton";
import { ReportDataTable } from "@/components/reports/report-data-table";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerReportData } from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type CustomerReportProps = {
  data: CustomerReportData;
  filters: ReportFilterInput;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

export function CustomerReport({ data, filters }: CustomerReportProps) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{data.period.label}</p>
        <ExportButton reportType="customers" filters={filters} />
      </div>

      <ReportSummaryCards
        items={[
          {
            label: "Toplam Müşteri",
            value: summary.totalCustomers.toLocaleString("tr-TR"),
          },
          {
            label: "Yeni Müşteri",
            value: summary.newCustomers.toLocaleString("tr-TR"),
          },
          {
            label: "Aktif Sözleşmeli",
            value: summary.activeContractCustomers.toLocaleString("tr-TR"),
          },
          {
            label: "Dönem İş Emri",
            value: summary.totalWorkOrdersInPeriod.toLocaleString("tr-TR"),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Müşteri Detayı</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportDataTable
            rows={data.rows}
            searchPlaceholder="Müşteri adı ara…"
            columns={[
              {
                id: "customer",
                header: "Müşteri",
                searchValue: (row) => row.customer_name,
                cell: (row) => row.customer_name,
              },
              {
                id: "branch",
                header: "Şube",
                searchValue: (row) => row.branch_name,
                cell: (row) => row.branch_name,
              },
              {
                id: "contracts",
                header: "Sözleşme Sayısı",
                cell: (row) => row.contract_count.toLocaleString("tr-TR"),
              },
              {
                id: "work_orders",
                header: "İş Emri Sayısı",
                cell: (row) => row.work_order_count.toLocaleString("tr-TR"),
              },
              {
                id: "activity",
                header: "Son Aktivite",
                cell: (row) => formatDate(row.last_activity),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
