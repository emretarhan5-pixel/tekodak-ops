"use client";

import Link from "next/link";

import { StockMovementAddButton } from "@/components/stock/StockMovementAddButton";
import { StockStatusBadge } from "@/components/stock/stock-status-badge";
import {
  formatStockQuantity,
  stockDetailHref,
  stockRowId,
} from "@/components/stock/stock-utils";
import { buttonVariants } from "@/components/ui/button";
import type { StockListItem } from "@/lib/api/stock/types";
import { cn } from "@/lib/utils";

export function StockCard({
  item,
  canEdit = false,
  onAddMovement,
}: {
  item: StockListItem;
  canEdit?: boolean;
  onAddMovement?: (partId: string, branchId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono font-semibold">{item.part_code}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        </div>
        <StockStatusBadge
          status={item.stock_status}
          variant={item.status_variant}
          currentQuantity={item.current_quantity}
        />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Kategori</dt>
          <dd className="text-right">{item.category_label}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Şube</dt>
          <dd>{item.branch_name}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Mevcut Stok</dt>
          <dd className="font-medium tabular-nums">
            {formatStockQuantity(item.current_quantity, item.unit)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Kritik Seviye</dt>
          <dd className="tabular-nums text-muted-foreground">
            {formatStockQuantity(item.min_stock, item.unit)}
          </dd>
        </div>
      </dl>

      <div
        className={cn(
          "mt-4 grid gap-2",
          canEdit ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {canEdit && onAddMovement ? (
          <StockMovementAddButton
            className="w-full"
            onOpen={() => onAddMovement(item.part_id, item.branch_id)}
          />
        ) : null}
        <Link
          href={stockDetailHref(item.part_id, item.branch_id)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Detay
        </Link>
      </div>
    </article>
  );
}

export function StockCardList({
  items,
  canEdit = false,
  onAddMovement,
}: {
  items: StockListItem[];
  canEdit?: boolean;
  onAddMovement?: (partId: string, branchId: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {items.map((item) => (
        <StockCard
          key={stockRowId(item)}
          item={item}
          canEdit={canEdit}
          onAddMovement={onAddMovement}
        />
      ))}
    </div>
  );
}
