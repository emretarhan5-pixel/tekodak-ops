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

import { TargetDisplayStatusBadge } from "@/components/targets/target-display-status-badge";
import { TargetProgressBar } from "@/components/targets/target-progress-bar";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTargetMetricValue } from "@/lib/api/targets/target-progress-display";
import type { TargetListItem } from "@/lib/api/targets/types";
import {
  getTargetMetricDisplayLabel,
  TARGET_PERIOD_TYPE_LABELS,
} from "@/lib/constants/target";
import { cn } from "@/lib/utils";

type TargetListProps = {
  data: TargetListItem[];
};

function formatPeriodLabel(item: TargetListItem): string {
  const periodLabel = TARGET_PERIOD_TYPE_LABELS[item.period_type];
  try {
    const start = format(parseISO(item.start_date), "d MMM yyyy", { locale: tr });
    const end = format(parseISO(item.end_date), "d MMM yyyy", { locale: tr });
    return `${periodLabel} · ${start} – ${end}`;
  } catch {
    return `${periodLabel} · ${item.start_date} – ${item.end_date}`;
  }
}

export function TargetList({ data }: TargetListProps) {
  const router = useRouter();

  const columns = React.useMemo(
    () => [
      {
        id: "name",
        header: "Hedef Adı",
        accessorKey: "name" as const,
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "metric_type",
        header: "Tip",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {getTargetMetricDisplayLabel(row.original.metric_type)}
          </span>
        ),
      },
      {
        id: "period",
        header: "Dönem",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <span className="min-w-[10rem] text-sm text-muted-foreground">
            {formatPeriodLabel(row.original)}
          </span>
        ),
      },
      {
        id: "branch",
        header: "Şube",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.branch_name}{" "}
            <span className="text-muted-foreground">
              ({row.original.branch_code})
            </span>
          </span>
        ),
      },
      {
        id: "target_value",
        header: "Hedef Değer",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm font-medium tabular-nums">
            {formatTargetMetricValue(
              row.original.metric_type,
              row.original.target_value,
            )}
          </span>
        ),
      },
      {
        id: "current_value",
        header: "Mevcut Değer",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <span className="whitespace-nowrap text-sm font-medium tabular-nums">
            {formatTargetMetricValue(
              row.original.metric_type,
              row.original.current_value,
            )}
          </span>
        ),
      },
      {
        id: "progress",
        header: "İlerleme",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <TargetProgressBar
            percentage={row.original.completion_percentage}
            displayStatus={row.original.display_status}
          />
        ),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <TargetDisplayStatusBadge
            displayStatus={row.original.display_status}
            label={row.original.display_status_label}
          />
        ),
      },
      {
        id: "actions",
        header: "Aksiyonlar",
        enableSorting: false,
        cell: ({ row }: CellContext<TargetListItem, unknown>) => (
          <div className="flex justify-end">
            <Link
              href={`/targets/${row.original.id}`}
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
    <div className="hidden rounded-lg border border-border md:block">
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
              className={cn(
                "cursor-pointer hover:bg-muted/40",
                row.original.status === "cancelled" && "opacity-60 bg-muted/20",
              )}
              onClick={() => router.push(`/targets/${row.original.id}`)}
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
