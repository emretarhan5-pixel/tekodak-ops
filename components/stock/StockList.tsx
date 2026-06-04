"use client";

import type { CellContext } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { StockMovementAddButton } from "@/components/stock/StockMovementAddButton";
import { StockStatusBadge } from "@/components/stock/stock-status-badge";
import {
  formatStockQuantity,
  stockDetailHref,
  stockRowId,
} from "@/components/stock/stock-utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockListItem } from "@/lib/api/stock/types";
import { cn } from "@/lib/utils";

type StockListProps = {
  data: StockListItem[];
  canEdit?: boolean;
  onAddMovement?: (partId: string, branchId: string) => void;
};

export function StockList({
  data,
  canEdit = false,
  onAddMovement,
}: StockListProps) {
  const router = useRouter();

  const columns = React.useMemo(
    () => [
      {
        id: "part_code",
        header: "Ürün Kodu",
        accessorKey: "part_code" as const,
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <span className="font-mono font-medium">{row.original.part_code}</span>
        ),
      },
      {
        id: "description",
        header: "Ad",
        accessorKey: "description" as const,
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <span className="line-clamp-2 max-w-[240px] text-sm">
            {row.original.description}
          </span>
        ),
      },
      {
        id: "category",
        header: "Kategori",
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.category_label}
          </span>
        ),
      },
      {
        id: "branch",
        header: "Şube",
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.branch_name}
          </span>
        ),
      },
      {
        id: "current_quantity",
        header: "Mevcut Stok",
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm tabular-nums font-medium">
            {formatStockQuantity(
              row.original.current_quantity,
              row.original.unit,
            )}
          </span>
        ),
      },
      {
        id: "min_stock",
        header: "Kritik Seviye",
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            {formatStockQuantity(row.original.min_stock, row.original.unit)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <StockStatusBadge
            status={row.original.stock_status}
            variant={row.original.status_variant}
            currentQuantity={row.original.current_quantity}
          />
        ),
      },
      {
        id: "actions",
        header: "Aksiyonlar",
        enableSorting: false,
        cell: ({ row }: CellContext<StockListItem, unknown>) => (
          <div className="flex justify-end gap-2">
            {canEdit && onAddMovement ? (
              <StockMovementAddButton
                stopPropagation
                className="h-8"
                onOpen={() =>
                  onAddMovement(row.original.part_id, row.original.branch_id)
                }
              />
            ) : null}
            <Link
              href={stockDetailHref(
                row.original.part_id,
                row.original.branch_id,
              )}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 gap-1",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3.5" />
              Detay
            </Link>
          </div>
        ),
      },
    ],
    [canEdit, onAddMovement],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => stockRowId(row),
  });

  return (
    <div className={cn("hidden rounded-lg border border-border md:block")}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "whitespace-nowrap",
                    header.column.id === "actions" && "text-right",
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-muted/40"
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (
                  target.closest("[data-stock-actions]") ||
                  target.closest("a")
                ) {
                  return;
                }
                router.push(
                  stockDetailHref(
                    row.original.part_id,
                    row.original.branch_id,
                  ),
                );
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="align-middle"
                  onClick={
                    cell.column.id === "actions"
                      ? (event) => event.stopPropagation()
                      : undefined
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
