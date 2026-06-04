"use client";

import { Suspense } from "react";

import { ContractCardList } from "@/components/contracts/ContractCard";
import { ContractFilters } from "@/components/contracts/ContractFilters";
import { ContractList } from "@/components/contracts/ContractList";
import { ContractPagination } from "@/components/contracts/contract-pagination";
import type { ContractFilterOptions } from "@/lib/api/contracts/types";
import type { ContractListResult } from "@/lib/api/contracts/types";
import type { ContractFilterInput } from "@/schemas/contract";

type ContractsDataSectionProps = {
  result: ContractListResult;
  filterOptions: ContractFilterOptions;
  filters: ContractFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function ContractsDataSection({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: ContractsDataSectionProps) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <ContractFilters
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      </Suspense>

      <div className="space-y-4">
        <ContractList data={result.data} />
        <ContractCardList contracts={result.data} />
        <ContractPagination filters={filters} total={result.total} />
      </div>
    </div>
  );
}
