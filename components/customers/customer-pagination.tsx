"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomerPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
};

function buildPageHref(
  searchParams: URLSearchParams,
  page: number,
): string {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `/customers?${query}` : "/customers";
}

function getPageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, current]);
  for (let offset = -1; offset <= 1; offset += 1) {
    const page = current + offset;
    if (page > 1 && page < totalPages) {
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export function CustomerPagination({
  page,
  pageSize,
  total,
}: CustomerPaginationProps) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString() ?? "");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  const prevHref = buildPageHref(params, page - 1);
  const nextHref = buildPageHref(params, page + 1);

  if (totalPages <= 1 && total > 0) {
    return (
      <p className="border-t border-border pt-4 text-sm text-muted-foreground">
        {from}–{to} / {total} müşteri
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? "Kayıt yok"
          : `${from}–${to} / ${total} müşteri`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled className="gap-1">
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Önceki</span>
          </Button>
        ) : (
          <Link
            href={prevHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1",
            )}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Önceki</span>
          </Link>
        )}

        <div className="flex items-center gap-0.5 px-1">
          {pageNumbers.map((pageNum, index) => {
            const prevNum = pageNumbers[index - 1];
            const showEllipsis = prevNum !== undefined && pageNum - prevNum > 1;

            return (
              <span key={pageNum} className="flex items-center gap-0.5">
                {showEllipsis ? (
                  <span className="px-1 text-muted-foreground">…</span>
                ) : null}
                {pageNum === page ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="min-w-9"
                    disabled
                  >
                    {pageNum}
                  </Button>
                ) : (
                  <Link
                    href={buildPageHref(params, pageNum)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "min-w-9",
                    )}
                  >
                    {pageNum}
                  </Link>
                )}
              </span>
            );
          })}
        </div>

        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled className="gap-1">
            <span className="hidden sm:inline">Sonraki</span>
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Link
            href={nextHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1",
            )}
          >
            <span className="hidden sm:inline">Sonraki</span>
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
