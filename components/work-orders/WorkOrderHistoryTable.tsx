"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Wrench } from "lucide-react";
import Link from "next/link";

import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/constants/work-order";
import { cn } from "@/lib/utils";

type WorkOrderHistoryTableProps = {
  title: string;
  description: string;
  workOrders: WorkOrderListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  newWorkOrderHref?: string;
  showCustomer?: boolean;
  showDevice?: boolean;
  canEdit?: boolean;
};

function formatScheduledDate(date: string | null): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "d MMM yyyy", { locale: tr });
  } catch {
    return date;
  }
}

export function WorkOrderHistoryTable({
  title,
  description,
  workOrders,
  emptyTitle = "İş emri yok",
  emptyDescription = "Bu kayıt için henüz iş emri oluşturulmamış.",
  newWorkOrderHref,
  showCustomer = false,
  showDevice = false,
  canEdit = false,
}: WorkOrderHistoryTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {canEdit && newWorkOrderHref ? (
          <Link
            href={newWorkOrderHref}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
          >
            <Plus className="size-4" />
            İş Emri Ekle
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {workOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
            <Wrench className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
            {canEdit && newWorkOrderHref ? (
              <Link
                href={newWorkOrderHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5",
                )}
              >
                <Plus className="size-4" />
                İş emri oluştur
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İş emri no</TableHead>
                  {showCustomer ? <TableHead>Müşteri</TableHead> : null}
                  {showDevice ? <TableHead>Cihaz</TableHead> : null}
                  <TableHead>İş tipi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Planlanan</TableHead>
                  <TableHead>Atanan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((wo) => (
                  <TableRow key={wo.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="font-mono text-sm font-medium text-primary hover:underline"
                      >
                        {wo.work_order_number}
                      </Link>
                    </TableCell>
                    {showCustomer ? (
                      <TableCell className="text-sm">
                        {wo.customer_name}
                      </TableCell>
                    ) : null}
                    {showDevice ? (
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {wo.device_label ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-sm">
                      {WORK_ORDER_TYPE_LABELS[wo.work_type]}
                    </TableCell>
                    <TableCell>
                      <WorkOrderStatusBadge
                        status={wo.status}
                        variant={wo.status_variant}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {WORK_ORDER_PRIORITY_LABELS[wo.priority]}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {formatScheduledDate(wo.scheduled_date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {wo.assignee_name ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
