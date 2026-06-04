"use client";

import { Suspense, useState } from "react";

import { StockCardList } from "@/components/stock/StockCard";
import { StockFilters } from "@/components/stock/StockFilters";
import { StockList } from "@/components/stock/StockList";
import { StockMovementModal } from "@/components/stock/StockMovementModal";
import { StockPagination } from "@/components/stock/stock-pagination";
import type {
  StockFilterOptions,
  StockListResult,
} from "@/lib/api/stock/types";
import type { StockItemFilterInput } from "@/schemas/stock-item";

type StockMovementTarget = {
  partId: string;
  branchId: string;
};

type StockDataSectionProps = {
  result: StockListResult;
  filterOptions: StockFilterOptions;
  filters: StockItemFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
  canEdit?: boolean;
};

export function StockDataSection({
  result,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
  canEdit = false,
}: StockDataSectionProps) {
  const [movementTarget, setMovementTarget] = useState<StockMovementTarget | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <StockFilters
          filterOptions={filterOptions}
          filters={filters}
          showBranchFilter={showBranchFilter}
          staffBranchLabel={staffBranchLabel}
        />
      </Suspense>

      <div className="space-y-4">
        <StockList
          data={result.data}
          canEdit={canEdit}
          onAddMovement={(partId, branchId) =>
            setMovementTarget({ partId, branchId })
          }
        />
        <StockCardList
          items={result.data}
          canEdit={canEdit}
          onAddMovement={(partId, branchId) =>
            setMovementTarget({ partId, branchId })
          }
        />
        <StockPagination filters={filters} total={result.total} />
      </div>

      {canEdit ? (
        <StockMovementModal
          open={movementTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setMovementTarget(null);
            }
          }}
          partId={movementTarget?.partId ?? ""}
          branchId={movementTarget?.branchId ?? ""}
        />
      ) : null}
    </div>
  );
}
