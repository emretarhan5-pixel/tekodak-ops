"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TargetFilterOptions } from "@/lib/api/targets/types";
import {
  getTargetMetricDisplayLabel,
  TARGET_ALL_METRIC_TYPES,
  TARGET_FILTER_PERIOD_TYPES,
  TARGET_PERIOD_TYPE_LABELS,
  TARGET_STATUS_LABELS,
  TARGET_STATUSES,
} from "@/lib/constants/target";
import type { TargetFilterInput } from "@/schemas/target";
import { cn } from "@/lib/utils";

type TargetFiltersProps = {
  filterOptions: TargetFilterOptions;
  filters: TargetFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

const selectClassName = cn(
  "flex h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

export function TargetFilters({
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: TargetFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  const buildParams = useCallback(
    (
      overrides: Partial<Record<string, string | undefined>>,
      resetPage = true,
    ) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");

      for (const [key, raw] of Object.entries(overrides)) {
        if (raw === undefined || raw === "") {
          next.delete(key);
        } else {
          next.set(key, raw);
        }
      }

      if (resetPage) {
        next.delete("page");
      }

      return next.toString();
    },
    [searchParams],
  );

  function push(nextQuery: string) {
    startTransition(() => {
      router.push(nextQuery ? `${pathname ?? "/"}?${nextQuery}` : pathname ?? "/");
    });
  }

  const chipLabel = useMemo(() => {
    const chips: string[] = [];
    if (filters.search?.trim()) {
      chips.push(`“${filters.search.trim()}”`);
    }
    if (filters.branchId && showBranchFilter) {
      const branch = filterOptions.branches.find(
        (item) => item.id === filters.branchId,
      );
      if (branch) chips.push(branch.name);
    }
    if (filters.metricType) {
      chips.push(getTargetMetricDisplayLabel(filters.metricType));
    }
    if (filters.periodType) {
      chips.push(TARGET_PERIOD_TYPE_LABELS[filters.periodType]);
    }
    if (filters.status) {
      chips.push(TARGET_STATUS_LABELS[filters.status]);
    }
    return chips;
  }, [filters, filterOptions, showBranchFilter]);

  function applySearch() {
    const value = searchInput.trim();
    push(buildParams({ search: value || undefined }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid flex-1 gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Arama
          </label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Hedef adı"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applySearch();
                }
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-10 gap-2 md:shrink-0"
          disabled={isPending}
          onClick={() => applySearch()}
        >
          Ara
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {showBranchFilter ? (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Şube
            </label>
            <select
              className={selectClassName}
              value={filters.branchId ?? ""}
              disabled={isPending}
              onChange={(e) => {
                const value = e.target.value;
                push(buildParams({ branchId: value || undefined }));
              }}
            >
              <option value="">Tüm şubeler</option>
              {filterOptions.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>
        ) : staffBranchLabel ? (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Şube
            </label>
            <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm">
              {staffBranchLabel}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Tip
          </label>
          <select
            className={selectClassName}
            value={filters.metricType ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const value = e.target.value;
              push(buildParams({ metricType: value || undefined }));
            }}
          >
            <option value="">Tüm tipler</option>
            {TARGET_ALL_METRIC_TYPES.map((value) => (
              <option key={value} value={value}>
                {getTargetMetricDisplayLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Dönem
          </label>
          <select
            className={selectClassName}
            value={filters.periodType ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const value = e.target.value;
              push(buildParams({ periodType: value || undefined }));
            }}
          >
            <option value="">Tüm dönemler</option>
            {TARGET_FILTER_PERIOD_TYPES.map((value) => (
              <option key={value} value={value}>
                {TARGET_PERIOD_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Durum
          </label>
          <select
            className={selectClassName}
            value={filters.status ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const value = e.target.value;
              push(
                buildParams({
                  status: value || undefined,
                }),
              );
            }}
          >
            <option value="">Tüm durumlar</option>
            {TARGET_STATUSES.map((value) => (
              <option key={value} value={value}>
                {TARGET_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chipLabel.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          <span>Aktif filtreler:</span>
          {chipLabel.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5"
            >
              {chip}
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={isPending}
            onClick={() => push("")}
          >
            Temizle
          </Button>
        </div>
      ) : null}
    </div>
  );
}
