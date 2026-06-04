"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { buttonVariants } from "@/components/ui/button";
import { TARGET_LIST_PAGE_SIZE } from "@/lib/constants/target";
import type { TargetFilterInput } from "@/schemas/target";
import { cn } from "@/lib/utils";

type TargetPaginationProps = {
  filters: TargetFilterInput;
  total: number;
  basePath?: string;
};

function toQueryString(filters: TargetFilterInput, page: number): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.branchId) {
    params.set("branchId", filters.branchId);
  }
  if (filters.metricType) {
    params.set("metricType", filters.metricType);
  }
  if (filters.periodType) {
    params.set("periodType", filters.periodType);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.pageSize !== TARGET_LIST_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function TargetPagination({
  filters,
  total,
  basePath = "/targets",
}: TargetPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  const links = useMemo(() => {
    const current = filters.page;
    return {
      prev: current > 1 ? toQueryString(filters, current - 1) : null,
      next: current < totalPages ? toQueryString(filters, current + 1) : null,
    };
  }, [filters, totalPages]);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Toplam <span className="font-medium text-foreground">{total}</span> hedef
        · Sayfa {filters.page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={links.prev ? `${basePath}${links.prev}` : "#"}
          aria-disabled={!links.prev}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1",
            !links.prev && "pointer-events-none opacity-50",
          )}
          scroll={false}
        >
          <ChevronLeft className="size-4" />
          Önceki
        </Link>
        <Link
          href={links.next ? `${basePath}${links.next}` : "#"}
          aria-disabled={!links.next}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1",
            !links.next && "pointer-events-none opacity-50",
          )}
          scroll={false}
        >
          Sonraki
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
