import Link from "next/link";
import { Plus } from "lucide-react";

import { TargetsDataSection } from "@/components/targets/targets-data-section";
import { TargetsEmptyState } from "@/components/targets/targets-empty-state";
import { TargetSummaryCards } from "@/components/targets/TargetSummaryCards";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  TargetFilterOptions,
  TargetListResult,
  TargetListSummary,
} from "@/lib/api/targets/types";
import type { TargetFilterInput } from "@/schemas/target";
import { cn } from "@/lib/utils";

export type TargetsPageContentProps = {
  result: TargetListResult;
  summary: TargetListSummary;
  filterOptions: TargetFilterOptions;
  filters: TargetFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
};

export function TargetsPageContent({
  result,
  summary,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
}: TargetsPageContentProps) {
  const showNoTargetsYet = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hedefler</h1>
          <p className="mt-1 text-muted-foreground">
            Şube ve personel hedeflerinin otomatik ilerleme takibi
          </p>
        </div>
        <Link href="/targets/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" />
          Yeni Hedef
        </Link>
      </div>

      {!showNoTargetsYet ? <TargetSummaryCards summary={summary} /> : null}

      {showNoTargetsYet ? (
        <TargetsEmptyState />
      ) : showNoFilterResults ? (
        <>
          <TargetsDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun hedef bulunamadı. Filtreleri temizleyip tekrar
              deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <TargetsDataSection
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
