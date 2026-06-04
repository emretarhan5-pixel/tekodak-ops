"use client";

import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReportSummaryCardItem = {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
};

type ReportSummaryCardsProps = {
  items: ReportSummaryCardItem[];
  columns?: 2 | 3 | 4;
};

export function ReportSummaryCards({
  items,
  columns = 4,
}: ReportSummaryCardsProps) {
  const gridClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 xl:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={cn("grid gap-3", gridClass)}>
      {items.map((item) => (
        <Card key={item.label} className={cn("shadow-xs", item.className)}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold tabular-nums">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            {item.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
