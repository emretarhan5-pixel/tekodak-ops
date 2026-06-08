import Link from "next/link";
import { Plus } from "lucide-react";

import { ServiceRequestsDataSection } from "@/components/service-requests/service-requests-data-section";
import { ServiceRequestsEmptyState } from "@/components/service-requests/service-requests-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  ServiceRequestFilterOptions,
  ServiceRequestListResult,
} from "@/lib/api/service-requests/types";
import type { ServiceRequestFilterInput } from "@/schemas/service-request";
import { cn } from "@/lib/utils";

export type ServiceRequestsPageContentProps = {
  result: ServiceRequestListResult;
  filterOptions: ServiceRequestFilterOptions;
  filters: ServiceRequestFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
};

export function ServiceRequestsPageContent({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
}: ServiceRequestsPageContentProps) {
  const showEmpty = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servis Talepleri</h1>
          <p className="mt-1 text-muted-foreground">
            Müşteri cihaz kaydı, arıza tespiti ve teklif süreci
          </p>
        </div>
        <Link
          href="/service-requests/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="size-4" />
          Yeni Servis Talebi
        </Link>
      </div>

      {showEmpty ? (
        <ServiceRequestsEmptyState />
      ) : showNoFilterResults ? (
        <>
          <ServiceRequestsDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun servis talebi bulunamadı. Filtreleri temizleyip
              tekrar deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <ServiceRequestsDataSection
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
