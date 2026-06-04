"use client";

import { Suspense } from "react";

import { WorkOrderCardList } from "@/components/work-orders/WorkOrderCard";
import { WorkOrderFilters } from "@/components/work-orders/WorkOrderFilters";
import { WorkOrderList } from "@/components/work-orders/WorkOrderList";
import { WorkOrderPagination } from "@/components/work-orders/work-order-pagination";
import type { WorkOrderFilterOptions } from "@/lib/api/work-orders/types";
import type { WorkOrderListResult } from "@/lib/api/work-orders/types";
import type { WorkOrderFilterInput } from "@/schemas/work-order";

type WorkOrdersDataSectionProps = {
  result: WorkOrderListResult;
  filterOptions: WorkOrderFilterOptions;
  filters: WorkOrderFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function WorkOrdersDataSection({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: WorkOrdersDataSectionProps) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <WorkOrderFilters
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      </Suspense>

      <div className="space-y-4">
        <WorkOrderList data={result.data} />
        <WorkOrderCardList workOrders={result.data} />
        <WorkOrderPagination filters={filters} total={result.total} />
      </div>
    </div>
  );
}
