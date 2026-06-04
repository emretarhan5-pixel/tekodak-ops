"use client";

import { ExportButton } from "@/components/reports/ExportButton";
import { ReportDataTable } from "@/components/reports/report-data-table";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { formatStockQuantity } from "@/components/stock/stock-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockReportData } from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type StockReportProps = {
  data: StockReportData;
  filters: ReportFilterInput;
};

export function StockReport({ data, filters }: StockReportProps) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{data.period.label}</p>
        <ExportButton reportType="stock" filters={filters} />
      </div>

      <ReportSummaryCards
        items={[
          {
            label: "Toplam Stok Kalemi",
            value: summary.totalItems.toLocaleString("tr-TR"),
          },
          {
            label: "Kritik Stok",
            value: summary.criticalCount.toLocaleString("tr-TR"),
          },
          {
            label: "Düşük Stok",
            value: summary.warningCount.toLocaleString("tr-TR"),
          },
          {
            label: "Dönem Giriş",
            value: summary.totalInbound.toLocaleString("tr-TR"),
          },
          {
            label: "Dönem Çıkış",
            value: summary.totalOutbound.toLocaleString("tr-TR"),
          },
        ]}
        columns={3}
      />

      {data.topUsedParts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En Çok Kullanılan Parçalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topUsedParts.map((item, index) => (
                <div
                  key={`${item.part_code}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-mono font-medium">{item.part_code}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {item.total_quantity.toLocaleString("tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stok Detayı</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportDataTable
            rows={data.rows}
            searchPlaceholder="Ürün kodu veya ad ara…"
            columns={[
              {
                id: "code",
                header: "Ürün",
                searchValue: (row) => `${row.part_code} ${row.description}`,
                cell: (row) => (
                  <div>
                    <p className="font-mono text-sm font-medium">{row.part_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.description}
                    </p>
                  </div>
                ),
              },
              {
                id: "branch",
                header: "Şube",
                searchValue: (row) => row.branch_name,
                cell: (row) => row.branch_name,
              },
              {
                id: "current",
                header: "Mevcut Stok",
                cell: (row) =>
                  formatStockQuantity(row.current_quantity, "piece"),
              },
              {
                id: "min",
                header: "Kritik Seviye",
                cell: (row) => formatStockQuantity(row.min_stock, "piece"),
              },
              {
                id: "status",
                header: "Durum",
                cell: (row) => row.stock_status_label,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
