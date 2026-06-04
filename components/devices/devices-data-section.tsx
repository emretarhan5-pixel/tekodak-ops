"use client";

import { Suspense } from "react";

import { DeviceCardList } from "@/components/devices/DeviceCard";
import { DeviceFilters } from "@/components/devices/DeviceFilters";
import { DeviceList } from "@/components/devices/DeviceList";
import { DevicePagination } from "@/components/devices/device-pagination";
import type { DeviceFilterOptions } from "@/lib/api/devices/types";
import type { DeviceListResult } from "@/lib/api/devices/types";
import type { DeviceFilterInput } from "@/schemas/device";

type DevicesDataSectionProps = {
  result: DeviceListResult;
  filterOptions: DeviceFilterOptions;
  filters: DeviceFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function DevicesDataSection({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: DevicesDataSectionProps) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <DeviceFilters
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      </Suspense>

      <div className="space-y-4">
        <DeviceList data={result.data} />
        <DeviceCardList devices={result.data} />
        <DevicePagination filters={filters} total={result.total} />
      </div>
    </div>
  );
}
