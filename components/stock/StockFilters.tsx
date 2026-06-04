"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StockFilterOptions } from "@/lib/api/stock/types";
import {
  STOCK_STATUS_FILTER_LABELS,
  STOCK_STATUS_FILTERS,
} from "@/lib/constants/stock-item";
import type { StockItemFilterInput } from "@/schemas/stock-item";
import { cn } from "@/lib/utils";

type StockFiltersProps = {
  filterOptions: StockFilterOptions;
  filters: StockItemFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

const selectClassName = cn(
  "flex h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

export function StockFilters({
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: StockFiltersProps) {
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
    if (filters.category) {
      const c = filterOptions.categories.find((x) => x.code === filters.category);
      if (c) chips.push(c.label);
    }
    if (filters.status) {
      chips.push(STOCK_STATUS_FILTER_LABELS[filters.status]);
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
              placeholder="Ürün kodu veya ad"
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                push(buildParams({ branchId: v || undefined }));
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
            Kategori
          </label>
          <select
            className={selectClassName}
            value={filters.category ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value;
              push(buildParams({ category: v || undefined }));
            }}
          >
            <option value="">Tüm kategoriler</option>
            {filterOptions.categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Stok durumu
          </label>
          <select
            className={selectClassName}
            value={filters.status ?? ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value;
              push(
                buildParams({
                  status:
                    v && (STOCK_STATUS_FILTERS as readonly string[]).includes(v)
                      ? v
                      : undefined,
                }),
              );
            }}
          >
            <option value="">Tümü</option>
            {STOCK_STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {STOCK_STATUS_FILTER_LABELS[status]}
              </option>
            ))}
          </select>
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
