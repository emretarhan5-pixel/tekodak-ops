"use client";

import type { CellContext } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { WarrantyStatusBadge } from "@/components/devices/warranty-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeviceListItem } from "@/lib/api/devices/types";
import { DEVICE_STATUS_LABELS } from "@/lib/constants/device";
import { cn } from "@/lib/utils";

type DeviceListProps = {
  data: DeviceListItem[];
};

function brandModelCell(props: CellContext<DeviceListItem, unknown>) {
  const row = props.row.original;
  return (
    <div className="min-w-0">
      <span className="font-medium">{row.brand_name}</span>
      <span className="text-muted-foreground"> · </span>
      <span className="text-sm">{row.model_name}</span>
    </div>
  );
}

function branchCell(props: CellContext<DeviceListItem, unknown>) {
  const row = props.row.original;
  return (
    <span className="whitespace-nowrap text-sm">
      {row.branch_name}{" "}
      <span className="text-muted-foreground">({row.branch_code})</span>
    </span>
  );
}

export function DeviceList({ data }: DeviceListProps) {
  const columns = React.useMemo(
    () => [
      {
        id: "serial_number",
        header: "Seri No",
        accessorKey: "serial_number" as const,
        cell: ({ row }: CellContext<DeviceListItem, unknown>) => (
          <span className="font-mono font-medium">{row.original.serial_number}</span>
        ),
      },
      {
        id: "brand_model",
        header: "Marka/Model",
        cell: brandModelCell,
      },
      {
        id: "customer",
        header: "Müşteri",
        accessorKey: "customer_name" as const,
        cell: ({ row }: CellContext<DeviceListItem, unknown>) => (
          <Link
            href={`/customers/${row.original.customer_id}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {row.original.customer_name}
          </Link>
        ),
      },
      {
        id: "branch",
        header: "Şube",
        cell: branchCell,
      },
      {
        id: "warranty",
        header: "Garanti Durumu",
        cell: ({ row }: CellContext<DeviceListItem, unknown>) => (
          <WarrantyStatusBadge badge={row.original.warranty_badge} />
        ),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }: CellContext<DeviceListItem, unknown>) => {
          const device = row.original;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm">
                {DEVICE_STATUS_LABELS[device.status]}
              </span>
              {device.is_scrapped ? (
                <Badge
                  variant="secondary"
                  className="bg-muted text-[10px] text-muted-foreground"
                >
                  Hek
                </Badge>
              ) : null}
              {device.scrap_status === "pending_approval" ? (
                <Badge className="border-amber-300 bg-amber-100 text-[10px] text-amber-900 hover:bg-amber-100">
                  Onay Bekliyor
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksiyonlar",
        enableSorting: false,
        cell: ({ row }: CellContext<DeviceListItem, unknown>) => (
          <div className="flex justify-end">
            <Link
              href={`/devices/${row.original.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 gap-1",
              )}
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
    <div className={cn("hidden md:block rounded-lg border border-border")}>
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
            <TableRow key={row.id} className="hover:bg-muted/40">
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
