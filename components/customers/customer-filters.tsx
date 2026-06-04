"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  BranchOption,
  SectorOption,
} from "@/lib/api/customers/get-customer-filter-options";
import { CONTRACT_STATUS_FILTER_OPTIONS } from "@/lib/constants/customer-contract-status";
import { cn } from "@/lib/utils";

type CustomerFiltersProps = {
  branches: BranchOption[];
  sectors: SectorOption[];
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  startTransition?: React.TransitionStartFunction;
  isPending?: boolean;
};

const selectClassName = cn(
  "flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

export function CustomerFilters({
  branches,
  sectors,
  showBranchFilter,
  staffBranchLabel,
  startTransition: startTransitionProp,
  isPending: isPendingProp,
}: CustomerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPendingLocal, startTransitionLocal] = useTransition();
  const startTransition = startTransitionProp ?? startTransitionLocal;
  const isPending = isPendingProp ?? isPendingLocal;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      params.delete("page");

      startTransition(() => {
        router.push(`/customers?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateParams({
      search: (formData.get("search") as string) || null,
      branchId: showBranchFilter
        ? (formData.get("branchId") as string) || null
        : null,
      sector: (formData.get("sector") as string) || null,
      contractStatus: (formData.get("contractStatus") as string) || null,
    });
  }

  function handleReset() {
    startTransition(() => {
      router.push("/customers");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-4",
        isPending && "pointer-events-none opacity-70",
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2 md:col-span-2 xl:col-span-5">
          <Label htmlFor="search">Ara</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              name="search"
              defaultValue={searchParams?.get("search") ?? ""}
              placeholder="Kurum adı veya vergi no..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="branchId">Şube</Label>
          {showBranchFilter ? (
            <select
              id="branchId"
              name="branchId"
              defaultValue={searchParams?.get("branchId") ?? ""}
              className={selectClassName}
            >
              <option value="">Tümü</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="branchId"
              value={staffBranchLabel ?? "—"}
              disabled
              readOnly
              className="bg-muted/40"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Sektör</Label>
          <select
            id="sector"
            name="sector"
            defaultValue={searchParams?.get("sector") ?? ""}
            className={selectClassName}
          >
            <option value="">Tümü</option>
            {sectors.map((sector) => (
              <option key={sector.code} value={sector.code}>
                {sector.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractStatus">Sözleşme durumu</Label>
          <select
            id="contractStatus"
            name="contractStatus"
            defaultValue={searchParams?.get("contractStatus") ?? ""}
            className={selectClassName}
          >
            <option value="">Tümü</option>
            {CONTRACT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Filtreleniyor…" : "Filtrele"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isPending}
        >
          Filtreleri Temizle
        </Button>
      </div>
    </form>
  );
}
