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

import { ContractRenewalBadgeDisplay } from "@/components/contracts/contract-renewal-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContractListItem } from "@/lib/api/contracts/types";
import { formatContractPrice } from "@/lib/utils/format-contract-price";
import { cn } from "@/lib/utils";

type ContractListProps = {
  data: ContractListItem[];
};

function formatDateRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), "d MMM yyyy", { locale: tr });
    const e = format(parseISO(end), "d MMM yyyy", { locale: tr });
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} gün geçti`;
  }
  if (days === 0) {
    return "Bugün bitiyor";
  }
  return `${days} gün`;
}

export function ContractList({ data }: ContractListProps) {
  const router = useRouter();

  const columns = React.useMemo(
    () => [
      {
        id: "contract_number",
        header: "Sözleşme No",
        accessorKey: "contract_number" as const,
        cell: ({ row }: CellContext<ContractListItem, unknown>) => (
          <span className="font-mono font-medium">
            {row.original.contract_number}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Müşteri",
        accessorKey: "customer_name" as const,
        cell: ({ row }: CellContext<ContractListItem, unknown>) => (
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
        id: "dates",
        header: "Başlangıç–Bitiş",
        cell: ({ row }: CellContext<ContractListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {formatDateRange(row.original.start_date, row.original.end_date)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }: CellContext<ContractListItem, unknown>) => (
          <ContractRenewalBadgeDisplay
            renewalBadge={row.original.renewal_badge}
            status={row.original.status}
          />
        ),
      },
      {
        id: "days_remaining",
        header: "Kalan Gün",
        cell: ({ row }: CellContext<ContractListItem, unknown>) => {
          const days = row.original.days_remaining;
          return (
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                days <= 30 && days >= 0 && "text-red-600 dark:text-red-400",
                days > 30 && days <= 90 && "text-amber-700 dark:text-amber-400",
                days < 0 && "text-muted-foreground",
              )}
            >
              {formatDaysRemaining(days)}
            </span>
          );
        },
      },
      {
        id: "amount",
        header: "Tutar",
        cell: ({ row }: CellContext<ContractListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm font-medium tabular-nums">
            {formatContractPrice(
              row.original.agreed_price,
              row.original.currency,
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Aksiyonlar",
        enableSorting: false,
        cell: ({ row }: CellContext<ContractListItem, unknown>) => (
          <div className="flex justify-end">
            <Link
              href={`/contracts/${row.original.id}`}
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
        "hidden overflow-x-auto md:block rounded-lg border border-border",
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
              onClick={() => router.push(`/contracts/${row.original.id}`)}
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
