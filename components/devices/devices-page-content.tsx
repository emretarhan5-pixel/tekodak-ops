import Link from "next/link";
import { Plus } from "lucide-react";

import { DevicesDataSection } from "@/components/devices/devices-data-section";
import { DevicesEmptyState } from "@/components/devices/devices-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DeviceFilterOptions } from "@/lib/api/devices/types";
import type { DeviceListResult } from "@/lib/api/devices/types";
import type { DeviceFilterInput } from "@/schemas/device";
import { cn } from "@/lib/utils";

export type DevicesPageContentProps = {
  result: DeviceListResult;
  filterOptions: DeviceFilterOptions;
  filters: DeviceFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  hasActiveFilters: boolean;
};

export function DevicesPageContent({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  hasActiveFilters,
}: DevicesPageContentProps) {
  const showNoDevicesYet = result.total === 0 && !hasActiveFilters;
  const showNoFilterResults = result.total === 0 && hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cihazlar</h1>
          <p className="mt-1 text-muted-foreground">Tüm kayıtlı cihazlarınız</p>
        </div>
        <Link href="/devices/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" />
          Yeni Cihaz
        </Link>
      </div>

      {showNoDevicesYet ? (
        <DevicesEmptyState />
      ) : showNoFilterResults ? (
        <>
          <DevicesDataSection
            result={result}
            filterOptions={filterOptions}
            filters={filters}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
          />
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Filtrelere uygun cihaz bulunamadı. Filtreleri temizleyip tekrar
              deneyin.
            </CardContent>
          </Card>
        </>
      ) : (
        <DevicesDataSection
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
