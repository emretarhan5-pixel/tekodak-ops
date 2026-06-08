import { ServiceRequestsDataSection } from "@/components/service-requests/service-requests-data-section";
import { ServiceRequestsEmptyState } from "@/components/service-requests/service-requests-empty-state";
import { ServiceRequestsPageHeader } from "@/components/service-requests/service-requests-page-header";
import { Card, CardContent } from "@/components/ui/card";
import type {
  ServiceRequestFilterOptions,
  ServiceRequestListResult,
} from "@/lib/api/service-requests/types";
import type { ServiceRequestFilterInput } from "@/schemas/service-request";
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
      <ServiceRequestsPageHeader />

      {showEmpty ? (
        <>
          <ServiceRequestsDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
            filtersOnly
          />
          <div data-onboarding-target="sr-tour-list">
            <ServiceRequestsEmptyState />
          </div>
        </>
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
