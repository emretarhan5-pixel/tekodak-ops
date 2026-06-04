"use client";

import type { CellContext } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";
import { WORK_ORDER_TYPE_LABELS } from "@/lib/constants/work-order";
import { cn } from "@/lib/utils";

type WorkOrderListProps = {
  data: WorkOrderListItem[];
};

function formatScheduledDate(date: string | null): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "d MMM yyyy", { locale: tr });
  } catch {
    return date;
  }
}

export function WorkOrderList({ data }: WorkOrderListProps) {
  const router = useRouter();

  const columns = React.useMemo(
    () => [
      {
        id: "work_order_number",
        header: "İş Emri No",
        accessorKey: "work_order_number" as const,
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <span className="font-mono font-medium">
            {row.original.work_order_number}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Müşteri",
        accessorKey: "customer_name" as const,
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <Link
            href={`/customers/${row.original.customer_id}`}
            className="text-primary underline-offset-4 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.customer_name}
          </Link>
        ),
      },
      {
        id: "device",
        header: "Cihaz",
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <span className="text-sm text-muted-foreground">
            {row.original.device_label ?? "—"}
          </span>
        ),
      },
      {
        id: "work_type",
        header: "Tip",
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {WORK_ORDER_TYPE_LABELS[row.original.work_type]}
          </span>
        ),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <WorkOrderStatusBadge
            status={row.original.status}
            variant={row.original.status_variant}
          />
        ),
      },
      {
        id: "assignee",
        header: "Atanan Personel",
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <span className="text-sm">
            {row.original.assignee_name ?? "—"}
          </span>
        ),
      },
      {
        id: "scheduled_date",
        header: "Tarih",
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {formatScheduledDate(row.original.scheduled_date)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Aksiyonlar",
        enableSorting: false,
        cell: ({ row }: CellContext<WorkOrderListItem, unknown>) => (
          <div className="flex justify-end">
            <Link
              href={`/work-orders/${row.original.id}`}
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
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
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
              onClick={() => router.push(`/work-orders/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="align-middle">
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
