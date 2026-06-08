"use client";

import { Suspense } from "react";

import { ServiceRequestCardList } from "@/components/service-requests/ServiceRequestCard";
import { ServiceRequestFilters } from "@/components/service-requests/ServiceRequestFilters";
import { ServiceRequestList } from "@/components/service-requests/ServiceRequestList";
import { ServiceRequestPagination } from "@/components/service-requests/service-request-pagination";
import type {
  ServiceRequestFilterOptions,
  ServiceRequestListResult,
} from "@/lib/api/service-requests/types";
import type { ServiceRequestFilterInput } from "@/schemas/service-request";

type ServiceRequestsDataSectionProps = {
  result: ServiceRequestListResult;
  filterOptions: ServiceRequestFilterOptions;
  filters: ServiceRequestFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function ServiceRequestsDataSection({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: ServiceRequestsDataSectionProps) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <ServiceRequestFilters
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      </Suspense>

      <div className="space-y-4">
        <ServiceRequestList data={result.data} />
        <ServiceRequestCardList serviceRequests={result.data} />
        <ServiceRequestPagination filters={filters} total={result.total} />
      </div>
    </div>
  );
}
