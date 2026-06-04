import Link from "next/link";
import { Plus } from "lucide-react";

import { CustomersDataSection } from "@/components/customers/customers-data-section";
import { CustomersEmptyState } from "@/components/customers/customers-empty-state";
import { ExportCustomersButton } from "@/components/customers/export-customers-button";
import { exportCustomers } from "@/lib/api/customers/export-customers";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomerFilterOptions } from "@/lib/api/customers/get-customer-filter-options";
import type { CustomerListResult } from "@/lib/api/customers/types";
import type { CustomerFilterInput } from "@/schemas/customer";
import { cn } from "@/lib/utils";

type CustomersPageContentProps = {
  result: CustomerListResult;
  filterOptions: CustomerFilterOptions;
  exportFilters: CustomerFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
};

export function CustomersPageContent({
  result,
  filterOptions,
  exportFilters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
}: CustomersPageContentProps) {
  const showNoCustomersYet = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Müşteriler</h1>
          <p className="mt-1 text-muted-foreground">Tüm müşterileriniz</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportCustomersButton
            filters={exportFilters}
            exportAction={exportCustomers}
          />
          <Link
            href="/customers/new"
            className={cn(buttonVariants(), "gap-2")}
          >
            <Plus className="size-4" />
            Yeni Müşteri
          </Link>
        </div>
      </div>

      {showNoCustomersYet ? (
        <CustomersEmptyState />
      ) : showNoFilterResults ? (
        <>
          <CustomersDataSection
            result={result}
            filterOptions={filterOptions}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun müşteri bulunamadı. Filtreleri temizleyip tekrar
              deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <CustomersDataSection
          result={result}
          filterOptions={filterOptions}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      )}
    </div>
  );
}
