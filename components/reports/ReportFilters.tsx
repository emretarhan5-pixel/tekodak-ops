"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { resolveReportPeriod } from "@/lib/api/reports/report-period";
import type { ReportFilterOptions } from "@/lib/api/reports/types";
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
} from "@/lib/constants/report";
import type { ReportFilterInput } from "@/schemas/report";
import { cn } from "@/lib/utils";

type ReportFiltersProps = {
  filters: ReportFilterInput;
  filterOptions: ReportFilterOptions;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  showPeriodFilter?: boolean;
};

const selectClassName = cn(
  "flex h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

export function ReportFilters({
  filters,
  filterOptions,
  showBranchFilter,
  staffBranchLabel,
  showPeriodFilter = true,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const buildParams = useCallback(
    (overrides: Partial<Record<string, string | undefined>>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");

      for (const [key, raw] of Object.entries(overrides)) {
        if (raw === undefined || raw === "") {
          next.delete(key);
        } else {
          next.set(key, raw);
        }
      }

      return next.toString();
    },
    [searchParams],
  );

  function push(overrides: Partial<Record<string, string | undefined>>) {
    const nextQuery = buildParams(overrides);
    startTransition(() => {
      router.push(nextQuery ? `${pathname ?? "/"}?${nextQuery}` : pathname ?? "/");
    });
  }

  return (
    <Card className="shadow-xs">
      <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {showPeriodFilter ? (
          <>
            <div className="space-y-2">
              <label htmlFor="report-period" className="text-sm font-medium">
                Dönem
              </label>
              <select
                id="report-period"
                className={selectClassName}
                value={filters.period}
                disabled={isPending}
                onChange={(event) => {
                  const nextPeriod = event.target.value;
                  if (nextPeriod === "custom") {
                    const defaults = resolveReportPeriod("month");
                    push({
                      period: nextPeriod,
                      dateFrom: defaults.from,
                      dateTo: defaults.to,
                    });
                    return;
                  }
                  push({
                    period: nextPeriod,
                    dateFrom: undefined,
                    dateTo: undefined,
                  });
                }}
              >
                {REPORT_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {REPORT_PERIOD_LABELS[period]}
                  </option>
                ))}
              </select>
            </div>

            {filters.period === "custom" ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="report-date-from" className="text-sm font-medium">
                    Başlangıç
                  </label>
                  <input
                    id="report-date-from"
                    type="date"
                    className={selectClassName}
                    value={filters.dateFrom ?? ""}
                    disabled={isPending}
                    onChange={(event) =>
                      push({ dateFrom: event.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="report-date-to" className="text-sm font-medium">
                    Bitiş
                  </label>
                  <input
                    id="report-date-to"
                    type="date"
                    className={selectClassName}
                    value={filters.dateTo ?? ""}
                    disabled={isPending}
                    onChange={(event) =>
                      push({ dateTo: event.target.value || undefined })
                    }
                  />
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium">Dönem</p>
            <p className="text-sm text-muted-foreground">
              Stok hareket özeti için dönem filtresi uygulanır; mevcut stok
              anlık görünümüdür.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="report-branch" className="text-sm font-medium">
            Şube
          </label>
          {showBranchFilter ? (
            <select
              id="report-branch"
              className={selectClassName}
              value={filters.branchId ?? ""}
              disabled={isPending}
              onChange={(event) =>
                push({ branchId: event.target.value || undefined })
              }
            >
              <option value="">Tüm şubeler</option>
              {filterOptions.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          ) : (
            <p className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm">
              {staffBranchLabel ?? "Şube"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
