"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ReportDataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
  className?: string;
};

type ReportDataTableProps<T> = {
  rows: T[];
  columns: ReportDataTableColumn<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function ReportDataTable<T>({
  rows,
  columns,
  searchPlaceholder = "Tabloda ara…",
  emptyMessage = "Kayıt bulunamadı.",
}: ReportDataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr");
    if (!term) return rows;

    return rows.filter((row) =>
      columns.some((column) => {
        const value = column.searchValue?.(row) ?? "";
        return value.toLocaleLowerCase("tr").includes(term);
      }),
    );
  }, [columns, rows, search]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn("whitespace-nowrap", column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn("align-middle", column.className)}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
