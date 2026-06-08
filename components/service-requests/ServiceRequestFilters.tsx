"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ServiceRequestFilterOptions } from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_STATUS_LABELS,
} from "@/lib/constants/service-request";
import type { ServiceRequestFilterInput } from "@/schemas/service-request";
import { cn } from "@/lib/utils";

type ServiceRequestFiltersProps = {
  filterOptions: ServiceRequestFilterOptions;
  filters: ServiceRequestFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

const selectClassName = cn(
  "flex h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

export function ServiceRequestFilters({
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: ServiceRequestFiltersProps) {
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
    if (filters.status) {
      chips.push(SERVICE_REQUEST_STATUS_LABELS[filters.status]);
    }
    if (filters.assignedTechnicianId) {
      const tech = filterOptions.technicians.find(
        (item) => item.id === filters.assignedTechnicianId,
      );
      if (tech) chips.push(tech.full_name);
    }
    if (filters.dateFrom) {
      chips.push(`Başlangıç: ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      chips.push(`Bitiş: ${filters.dateTo}`);
    }
    return chips;
  }, [filters, filterOptions, showBranchFilter]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor="sr-search" className="mb-1.5 block text-sm font-medium">
            Ara
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="sr-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  push(buildParams({ search: searchInput.trim() || undefined }));
                }
              }}
              placeholder="Talep no, firma, seri no…"
              className="h-10 pl-9"
            />
          </div>
        </div>

        {showBranchFilter ? (
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="sr-branch" className="mb-1.5 block text-sm font-medium">
              Şube
            </label>
            <select
              id="sr-branch"
              className={selectClassName}
              value={filters.branchId ?? ""}
              disabled={isPending}
              onChange={(e) =>
                push(buildParams({ branchId: e.target.value || undefined }))
              }
            >
              <option value="">Tüm şubeler</option>
              {filterOptions.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        ) : staffBranchLabel ? (
          <div className="min-w-[10rem] flex-1">
            <p className="mb-1.5 text-sm font-medium">Şube</p>
            <p className="flex h-10 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm">
              {staffBranchLabel}
            </p>
          </div>
        ) : null}

        <div className="min-w-[12rem] flex-1">
          <label htmlFor="sr-status" className="mb-1.5 block text-sm font-medium">
            Durum
          </label>
          <select
            id="sr-status"
            className={selectClassName}
            value={filters.status ?? ""}
            disabled={isPending}
            onChange={(e) =>
              push(buildParams({ status: e.target.value || undefined }))
            }
          >
            <option value="">Tüm durumlar</option>
            {SERVICE_REQUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SERVICE_REQUEST_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[12rem] flex-1">
          <label htmlFor="sr-tech" className="mb-1.5 block text-sm font-medium">
            Teknisyen
          </label>
          <select
            id="sr-tech"
            className={selectClassName}
            value={filters.assignedTechnicianId ?? ""}
            disabled={isPending}
            onChange={(e) =>
              push(
                buildParams({
                  assignedTechnicianId: e.target.value || undefined,
                }),
              )
            }
          >
            <option value="">Tüm teknisyenler</option>
            {filterOptions.technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="sr-date-from" className="mb-1.5 block text-sm font-medium">
            Başlangıç tarihi
          </label>
          <Input
            id="sr-date-from"
            type="date"
            className="h-10"
            value={filters.dateFrom ?? ""}
            disabled={isPending}
            onChange={(e) =>
              push(buildParams({ dateFrom: e.target.value || undefined }))
            }
          />
        </div>
        <div>
          <label htmlFor="sr-date-to" className="mb-1.5 block text-sm font-medium">
            Bitiş tarihi
          </label>
          <Input
            id="sr-date-to"
            type="date"
            className="h-10"
            value={filters.dateTo ?? ""}
            disabled={isPending}
            onChange={(e) =>
              push(buildParams({ dateTo: e.target.value || undefined }))
            }
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            className="h-10 w-full gap-2"
            disabled={isPending}
            onClick={() => push(buildParams({ search: searchInput.trim() || undefined }))}
          >
            <Search className="size-4" />
            Ara
          </Button>
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
