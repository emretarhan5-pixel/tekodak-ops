"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import { ExportButton } from "@/components/reports/ExportButton";
import { ReportDataTable } from "@/components/reports/report-data-table";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkOrderReportData } from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type WorkOrderReportProps = {
  data: WorkOrderReportData;
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

export function WorkOrderReport({ data, filters }: WorkOrderReportProps) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{data.period.label}</p>
        <ExportButton reportType="work_orders" filters={filters} />
      </div>

      <ReportSummaryCards
        items={[
          {
            label: "Toplam İş Emri",
            value: summary.totalCount.toLocaleString("tr-TR"),
          },
          {
            label: "Tamamlanan",
            value: summary.completedCount.toLocaleString("tr-TR"),
          },
          {
            label: "Devam Eden",
            value: summary.inProgressCount.toLocaleString("tr-TR"),
          },
          {
            label: "İptal",
            value: summary.cancelledCount.toLocaleString("tr-TR"),
          },
          {
            label: "Ort. Tamamlanma Süresi",
            value:
              summary.averageCompletionHours != null
                ? `${summary.averageCompletionHours.toLocaleString("tr-TR")} sa`
                : "—",
          },
        ]}
        columns={3}
      />

      {data.technicianDistribution.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teknisyen Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.technicianDistribution.map((item) => (
                <div
                  key={item.assignee_name}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{item.assignee_name}</span>
                  <span className="font-semibold tabular-nums">
                    {item.count.toLocaleString("tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İş Emri Detayı</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportDataTable
            rows={data.rows}
            searchPlaceholder="İş emri no veya müşteri ara…"
            columns={[
              {
                id: "number",
                header: "İş Emri No",
                searchValue: (row) => row.work_order_number,
                cell: (row) => (
                  <span className="font-mono text-sm">{row.work_order_number}</span>
                ),
              },
              {
                id: "customer",
                header: "Müşteri",
                searchValue: (row) => row.customer_name,
                cell: (row) => row.customer_name,
              },
              {
                id: "type",
                header: "Tip",
                cell: (row) => row.work_type_label,
              },
              {
                id: "assignee",
                header: "Atanan",
                searchValue: (row) => row.assignee_name,
                cell: (row) => row.assignee_name,
              },
              {
                id: "date",
                header: "Planlanan Tarih",
                cell: (row) => formatDate(row.scheduled_date),
              },
              {
                id: "duration",
                header: "Süre",
                cell: (row) =>
                  row.duration_hours != null
                    ? `${row.duration_hours.toLocaleString("tr-TR")} sa`
                    : "—",
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
