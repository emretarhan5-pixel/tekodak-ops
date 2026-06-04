"use client";

import { AlertTriangle, Package, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StockListSummary } from "@/lib/api/stock/types";
import { STOCK_STATUS_FILTER_LABELS } from "@/lib/constants/stock-item";

type StockSummaryCardsProps = {
  summary: StockListSummary;
};

export function StockSummaryCards({ summary }: StockSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Package className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums">{summary.totalItems}</p>
            <p className="text-sm text-muted-foreground">Toplam Ürün Sayısı</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <AlertTriangle className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {summary.criticalCount}
              </p>
              <Badge className="border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {STOCK_STATUS_FILTER_LABELS.critical}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Kritik Stok Sayısı</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <TrendingDown className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {summary.warningCount}
              </p>
              <Badge className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {STOCK_STATUS_FILTER_LABELS.warning}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Düşük Stok Sayısı</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
