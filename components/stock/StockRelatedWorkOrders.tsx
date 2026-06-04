"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatStockQuantity } from "@/components/stock/stock-utils";
import { getWorkOrderStatusVariant } from "@/lib/api/work-orders/work-order-status";
import type {
  StockItemDetail,
  StockRelatedWorkOrderItem,
} from "@/lib/api/stock/types";

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

type StockRelatedWorkOrdersProps = {
  items: StockRelatedWorkOrderItem[];
  unit: StockItemDetail["unit"];
};

export function StockRelatedWorkOrders({
  items,
  unit,
}: StockRelatedWorkOrdersProps) {
  if (items.length === 0) {
    return (
      <div className="space-y-2 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Bu parça henüz bir iş emrinde kullanılmamış.
        </p>
        <p className="text-xs text-muted-foreground">
          İş emri parça ekleme entegrasyonu Bölüm 6&apos;da tamamlanacaktır.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Bu şubede iş emirlerinde kullanılan parça kayıtları.
      </p>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İş Emri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Ekleyen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/work-orders/${row.work_order_id}`}
                    className="font-mono text-primary underline-offset-4 hover:underline"
                  >
                    {row.work_order_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <WorkOrderStatusBadge
                    status={row.work_order_status}
                    variant={getWorkOrderStatusVariant(row.work_order_status)}
                  />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatStockQuantity(row.quantity, unit)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                  {formatDateTime(row.added_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.added_by_name}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
