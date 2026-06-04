import Link from "next/link";
import { Plus } from "lucide-react";

import { ContractsDataSection } from "@/components/contracts/contracts-data-section";
import { ContractsEmptyState } from "@/components/contracts/contracts-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ContractFilterOptions } from "@/lib/api/contracts/types";
import type { ContractListResult } from "@/lib/api/contracts/types";
import type { ContractFilterInput } from "@/schemas/contract";
import { cn } from "@/lib/utils";

export type ContractsPageContentProps = {
  result: ContractListResult;
  filterOptions: ContractFilterOptions;
  filters: ContractFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
};

export function ContractsPageContent({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
}: ContractsPageContentProps) {
  const showNoContractsYet = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sözleşmeler</h1>
          <p className="mt-1 text-muted-foreground">
            Bakım sözleşmeleri ve yenileme takibi
          </p>
        </div>
        <Link href="/contracts/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" />
          Yeni Sözleşme
        </Link>
      </div>

      {showNoContractsYet ? (
        <ContractsEmptyState />
      ) : showNoFilterResults ? (
        <>
          <ContractsDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun sözleşme bulunamadı. Filtreleri temizleyip tekrar
              deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <ContractsDataSection
          result={result}
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      )}
    </div>
  );
}
