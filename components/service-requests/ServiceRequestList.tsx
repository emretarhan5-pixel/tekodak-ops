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

import { ServiceRequestStatusBadge } from "@/components/service-requests/service-request-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServiceRequestListItem } from "@/lib/api/service-requests/types";
import { SERVICE_REQUEST_STEP_LABELS } from "@/lib/constants/service-request";
import { cn } from "@/lib/utils";

type ServiceRequestListProps = {
  data: ServiceRequestListItem[];
};

function formatCreatedDate(date: string): string {
  try {
    return format(parseISO(date), "d MMM yyyy", { locale: tr });
  } catch {
    return date;
  }
}

export function ServiceRequestList({ data }: ServiceRequestListProps) {
  const router = useRouter();

  const columns = React.useMemo(
    () => [
      {
        id: "request_number",
        header: "Talep No",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <span className="font-mono font-medium">
            {row.original.request_number}
          </span>
        ),
      },
      {
        id: "company",
        header: "Firma / Kişi",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <div className="min-w-[10rem]">
            <p className="font-medium">{row.original.company_name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.contact_name}
            </p>
          </div>
        ),
      },
      {
        id: "device",
        header: "Cihaz",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <div className="min-w-[10rem] text-sm">
            <p>{row.original.brand_model}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.device_type} · {row.original.serial_number}
            </p>
          </div>
        ),
      },
      {
        id: "technician",
        header: "Teknisyen",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <span className="text-sm">{row.original.technician_name}</span>
        ),
      },
      {
        id: "step",
        header: "Adım",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {SERVICE_REQUEST_STEP_LABELS[row.original.current_step]}
          </span>
        ),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <ServiceRequestStatusBadge
            status={row.original.status}
            variant={row.original.status_variant}
          />
        ),
      },
      {
        id: "created_at",
        header: "Tarih",
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <time
            dateTime={row.original.created_at}
            suppressHydrationWarning
            className="whitespace-nowrap text-sm tabular-nums"
          >
            {formatCreatedDate(row.original.created_at)}
          </time>
        ),
      },
      {
        id: "actions",
        header: "Aksiyonlar",
        enableSorting: false,
        cell: ({ row }: CellContext<ServiceRequestListItem, unknown>) => (
          <div className="flex justify-end">
            <Link
              href={`/service-requests/${row.original.id}`}
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
    <div
      className={cn(
        "hidden overflow-x-auto rounded-lg border border-border md:block",
      )}
    >
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
              onClick={() =>
                router.push(`/service-requests/${row.original.id}`)
              }
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
