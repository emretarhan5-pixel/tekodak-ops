import Link from "next/link";
import { Plus } from "lucide-react";

import { WorkOrdersDataSection } from "@/components/work-orders/work-orders-data-section";
import { WorkOrdersEmptyState } from "@/components/work-orders/work-orders-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  WorkOrderFilterOptions,
  WorkOrderListResult,
} from "@/lib/api/work-orders/types";
import type { WorkOrderFilterInput } from "@/schemas/work-order";
import { cn } from "@/lib/utils";

export type WorkOrdersPageContentProps = {
  result: WorkOrderListResult;
  filterOptions: WorkOrderFilterOptions;
  filters: WorkOrderFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
};

export function WorkOrdersPageContent({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
}: WorkOrdersPageContentProps) {
  const showNoWorkOrdersYet = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İş Emirleri</h1>
          <p className="mt-1 text-muted-foreground">
            Bakım, onarım ve saha işlerinin takibi
          </p>
        </div>
        <Link
          href="/work-orders/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="size-4" />
          Yeni İş Emri
        </Link>
      </div>

      {showNoWorkOrdersYet ? (
        <WorkOrdersEmptyState />
      ) : showNoFilterResults ? (
        <>
          <WorkOrdersDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun iş emri bulunamadı. Filtreleri temizleyip tekrar
              deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <WorkOrdersDataSection
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
