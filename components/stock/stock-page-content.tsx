import Link from "next/link";
import { Plus } from "lucide-react";

import { StockSummaryCards } from "@/components/stock/StockSummaryCards";
import { StockDataSection } from "@/components/stock/stock-data-section";
import { StockEmptyState } from "@/components/stock/stock-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  StockFilterOptions,
  StockListResult,
  StockListSummary,
} from "@/lib/api/stock/types";
import type { StockItemFilterInput } from "@/schemas/stock-item";
import { cn } from "@/lib/utils";

export type StockPageContentProps = {
  result: StockListResult;
  summary: StockListSummary;
  filterOptions: StockFilterOptions;
  filters: StockItemFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
  canEdit?: boolean;
};

export function StockPageContent({
  result,
  summary,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
  canEdit = false,
}: StockPageContentProps) {
  const showNoStockYet = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok</h1>
          <p className="mt-1 text-muted-foreground">
            Şube bazlı parça ve malzeme envanteri
          </p>
        </div>
        <Link href="/stock/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" />
          Yeni Ürün
        </Link>
      </div>

      {!showNoStockYet ? <StockSummaryCards summary={summary} /> : null}

      {showNoStockYet ? (
        <StockEmptyState />
      ) : showNoFilterResults ? (
        <>
          <StockDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
            canEdit={canEdit}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun stok kaydı bulunamadı. Filtreleri temizleyip
              tekrar deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <StockDataSection
          result={result}
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
