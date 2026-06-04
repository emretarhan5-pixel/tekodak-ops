"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkOrderFilterOptions } from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPES,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/constants/work-order";
import type { WorkOrderFilterInput } from "@/schemas/work-order";
import { cn } from "@/lib/utils";

type WorkOrderFiltersProps = {
  filterOptions: WorkOrderFilterOptions;
  filters: WorkOrderFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

const selectClassName = cn(
  "flex h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

export function WorkOrderFilters({
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: WorkOrderFiltersProps) {
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
      const b = filterOptions.branches.find((x) => x.id === filters.branchId);
      if (b) chips.push(b.name);
    }
    if (filters.customerId) {
      const c = filterOptions.customers.find(
        (x) => x.id === filters.customerId,
      );
      if (c) chips.push(c.name);
    }
    if (filters.status) {
      chips.push(WORK_ORDER_STATUS_LABELS[filters.status]);
    }
    if (filters.workType) {
      chips.push(WORK_ORDER_TYPE_LABELS[filters.workType]);
    }
    if (filters.priority) {
      chips.push(WORK_ORDER_PRIORITY_LABELS[filters.priority]);
    }
    if (filters.assignedTo) {
      const u = filterOptions.assignees.find(
        (x) => x.id === filters.assignedTo,
      );
      if (u) chips.push(u.full_name);
    }
    if (filters.dateFrom) {
      chips.push(`Plan ≥ ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      chips.push(`Plan ≤ ${filters.dateTo}`);
    }
    return chips;
  }, [filters, filterOptions, showBranchFilter]);

  function applySearch() {
    const v = searchInput.trim();
    push(buildParams({ search: v || undefined }));
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
              placeholder="İş emri no veya müşteri adı"
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
                const v = e.target.value;
                push(
                  buildParams({
                    branchId: v || undefined,
                    customerId: undefined,
                  }),
                );
              }}
            >
              <option value="">Tüm şubeler</option>
              {filterOptions.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
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
            Müşteri
          </label>
          <select
            className={selectClassName}
            value={filters.customerId ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value;
              push(buildParams({ customerId: v || undefined }));
            }}
          >
            <option value="">Tüm müşteriler</option>
            {filterOptions.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
              const v = e.target.value;
              push(buildParams({ status: v || undefined }));
            }}
          >
            <option value="">Tümü</option>
            {WORK_ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {WORK_ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            İş tipi
          </label>
          <select
            className={selectClassName}
            value={filters.workType ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value;
              push(buildParams({ workType: v || undefined }));
            }}
          >
            <option value="">Tümü</option>
            {WORK_ORDER_TYPES.map((value) => (
              <option key={value} value={value}>
                {WORK_ORDER_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Personel
          </label>
          <select
            className={selectClassName}
            value={filters.assignedTo ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value;
              push(buildParams({ assignedTo: v || undefined }));
            }}
          >
            <option value="">Tümü</option>
            {filterOptions.assignees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Öncelik
          </label>
          <select
            className={selectClassName}
            value={filters.priority ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value;
              push(buildParams({ priority: v || undefined }));
            }}
          >
            <option value="">Tümü</option>
            {WORK_ORDER_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {WORK_ORDER_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Planlanan (başlangıç)
          </label>
          <Input
            type="date"
            className="h-10"
            value={filters.dateFrom ?? ""}
            disabled={isPending}
            onChange={(e) => {
              push(buildParams({ dateFrom: e.target.value || undefined }));
            }}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Planlanan (bitiş)
          </label>
          <Input
            type="date"
            className="h-10"
            value={filters.dateTo ?? ""}
            disabled={isPending}
            onChange={(e) => {
              push(buildParams({ dateTo: e.target.value || undefined }));
            }}
          />
        </div>
      </div>

      {chipLabel.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          <span>Aktif filtreler:</span>
          {chipLabel.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5"
            >
              {c}
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
