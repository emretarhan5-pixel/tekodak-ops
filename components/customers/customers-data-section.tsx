"use client";

import { Suspense, useTransition } from "react";

import { CustomerCardList } from "@/components/customers/customer-card";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerPagination } from "@/components/customers/customer-pagination";
import type { CustomerFilterOptions } from "@/lib/api/customers/get-customer-filter-options";
import type { CustomerListResult } from "@/lib/api/customers/types";

type CustomersDataSectionProps = {
  result: CustomerListResult;
  filterOptions: CustomerFilterOptions;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function CustomersDataSection({
  result,
  filterOptions,
  showBranchFilter,
  staffBranchLabel,
}: CustomersDataSectionProps) {
  const [isPending, startTransition] = useTransition();

  return (
  <>
      <Suspense fallback={null}>
        <CustomerFilters
          branches={filterOptions.branches}
          sectors={filterOptions.sectors}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
          startTransition={startTransition}
          isPending={isPending}
        />
      </Suspense>

      <div className="space-y-4">
        <CustomerList data={result.data} isLoading={isPending} />
        {!isPending ? <CustomerCardList data={result.data} /> : null}
      </div>

      <Suspense fallback={null}>
        <CustomerPagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
        />
      </Suspense>
    </>
  );
}
