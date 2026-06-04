"use client";

import { Suspense } from "react";

import { TargetCardList } from "@/components/targets/TargetCard";
import { TargetFilters } from "@/components/targets/TargetFilters";
import { TargetList } from "@/components/targets/TargetList";
import { TargetPagination } from "@/components/targets/target-pagination";
import type {
  TargetFilterOptions,
  TargetListResult,
} from "@/lib/api/targets/types";
import type { TargetFilterInput } from "@/schemas/target";

type TargetsDataSectionProps = {
  result: TargetListResult;
  filterOptions: TargetFilterOptions;
  filters: TargetFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function TargetsDataSection({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: TargetsDataSectionProps) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <TargetFilters
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      </Suspense>

      <div className="space-y-4">
        <TargetList data={result.data} />
        <TargetCardList targets={result.data} />
        <TargetPagination filters={filters} total={result.total} />
      </div>
    </div>
  );
}
