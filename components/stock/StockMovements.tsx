"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatMovementQuantityPrefix,
  getMovementQuantityClass,
  getMovementTypeBadgeClass,
  movementToneDotClass,
} from "@/lib/api/stock/stock-movement-display";
import { formatStockQuantity } from "@/components/stock/stock-utils";
import type { StockItemDetail, StockMovementItem } from "@/lib/api/stock/types";
import { INVENTORY_MOVEMENT_TYPE_LABELS } from "@/lib/constants/stock-movement";
import { cn } from "@/lib/utils";

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function formatQuantityChange(
  movement: StockMovementItem,
  unit: StockItemDetail["unit"],
): string {
  const abs = Math.abs(movement.quantity_change);
  const formatted = formatStockQuantity(abs, unit);
  const prefix = formatMovementQuantityPrefix(
    movement.movement_type,
    movement.quantity_change,
  );
  return `${prefix}${formatted}`.replace("+−", "−").replace("↔ +", "↔ +");
}

type StockMovementsProps = {
  movements: StockMovementItem[];
  unit: StockItemDetail["unit"];
};

export function StockMovements({ movements, unit }: StockMovementsProps) {
  if (movements.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Henüz stok hareketi kaydı yok.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead className="text-right">Miktar</TableHead>
            <TableHead>Sebep</TableHead>
            <TableHead>İş Emri</TableHead>
            <TableHead>Kaydeden</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap text-sm tabular-nums">
                {formatDateTime(movement.created_at)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                <Badge
                  className={cn(
                    "gap-1.5 font-normal",
                    getMovementTypeBadgeClass(movement.movement_type),
                  )}
                >
                  <span
                    aria-hidden
                    className={movementToneDotClass(movement.movement_type)}
                  />
                  {INVENTORY_MOVEMENT_TYPE_LABELS[movement.movement_type]}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right text-sm font-medium tabular-nums",
                  getMovementQuantityClass(
                    movement.movement_type,
                    movement.quantity_change,
                  ),
                )}
              >
                {formatQuantityChange(movement, unit)}
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-sm">
                {movement.reason ?? "—"}
              </TableCell>
              <TableCell className="text-sm">
                {movement.work_order_number ? (
                  <Link
                    href={`/work-orders/${movement.reference_id}`}
                    className="font-mono text-primary underline-offset-4 hover:underline"
                  >
                    {movement.work_order_number}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {movement.created_by_name}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
