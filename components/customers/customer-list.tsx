"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ContractStatusBadge } from "@/components/customers/contract-status-badge";
import { CustomerListSkeleton } from "@/components/customers/customer-list-skeleton";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";
import { ResponsiblePersonCell } from "@/components/customers/responsible-person-cell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerListItem } from "@/lib/api/customers/types";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<CustomerListItem>();

function SortableHeader({
  label,
  sorted,
  onClick,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onClick: () => void;
}) {
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium"
      onClick={onClick}
    >
      {label}
      <Icon className="size-3.5 text-muted-foreground" />
    </Button>
  );
}

type CustomerListProps = {
  data: CustomerListItem[];
  isLoading?: boolean;
};

export function CustomerList({ data, isLoading = false }: CustomerListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <SortableHeader
            label="Kurum adı"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting()}
          />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-[200px] items-center gap-2">
            {row.original.is_pinned ? (
              <Star
                className="size-4 shrink-0 fill-amber-400 text-amber-500"
                aria-label="Sabitlenmiş"
              />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      }),
      columnHelper.accessor("branch_name", {
        header: ({ column }) => (
          <SortableHeader
            label="Şube"
            sorted={column.getIsSorted() || false}
            onClick={() => column.toggleSorting()}
          />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("contract_badge", {
        header: "Sözleşme durumu",
        enableSorting: false,
        cell: ({ getValue }) => <ContractStatusBadge status={getValue()} />,
      }),
      columnHelper.accessor("responsible_names", {
        header: "Sorumlu personel",
        enableSorting: false,
        cell: ({ getValue }) => (
          <ResponsiblePersonCell names={getValue()} />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Aksiyonlar</span>,
        cell: ({ row }) => (
          <CustomerRowActions
            customerId={row.original.id}
            phone={row.original.main_phone}
            email={row.original.email}
          />
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return <CustomerListSkeleton />;
  }

  return (
    <div className="hidden rounded-xl border border-border bg-card md:block">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
              className="cursor-pointer"
              onClick={() => router.push(`/customers/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    cell.column.id === "name" && "whitespace-normal",
                  )}
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
