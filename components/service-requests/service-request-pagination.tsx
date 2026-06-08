"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { buttonVariants } from "@/components/ui/button";
import { SERVICE_REQUEST_LIST_PAGE_SIZE } from "@/lib/constants/service-request";
import type { ServiceRequestFilterInput } from "@/schemas/service-request";
import { cn } from "@/lib/utils";

type ServiceRequestPaginationProps = {
  filters: ServiceRequestFilterInput;
  total: number;
  basePath?: string;
};

function toQueryString(filters: ServiceRequestFilterInput, page: number): string {
  const p = new URLSearchParams();
  if (filters.search?.trim()) {
    p.set("search", filters.search.trim());
  }
  if (filters.branchId) {
    p.set("branchId", filters.branchId);
  }
  if (filters.status) {
    p.set("status", filters.status);
  }
  if (filters.assignedTechnicianId) {
    p.set("assignedTechnicianId", filters.assignedTechnicianId);
  }
  if (filters.dateFrom) {
    p.set("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    p.set("dateTo", filters.dateTo);
  }
  if (filters.pageSize !== SERVICE_REQUEST_LIST_PAGE_SIZE) {
    p.set("pageSize", String(filters.pageSize));
  }
  if (page > 1) {
    p.set("page", String(page));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function ServiceRequestPagination({
  filters,
  total,
  basePath = "/service-requests",
}: ServiceRequestPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  const links = useMemo(() => {
    const cur = filters.page;
    return {
      prev: cur > 1 ? toQueryString(filters, cur - 1) : null,
      next: cur < totalPages ? toQueryString(filters, cur + 1) : null,
    };
  }, [filters, totalPages]);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Toplam{" "}
        <span className="font-medium text-foreground">{total}</span> servis talebi
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
