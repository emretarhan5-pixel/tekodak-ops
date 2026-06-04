"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/constants/work-order";
import { cn } from "@/lib/utils";

function formatScheduledDate(date: string | null): string {
  if (!date) return "Planlanmadı";
  try {
    return format(parseISO(date), "d MMM yyyy", { locale: tr });
  } catch {
    return date;
  }
}

export function WorkOrderCard({ workOrder }: { workOrder: WorkOrderListItem }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono font-semibold">
            {workOrder.work_order_number}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {WORK_ORDER_TYPE_LABELS[workOrder.work_type]} ·{" "}
            {WORK_ORDER_PRIORITY_LABELS[workOrder.priority]}
          </p>
        </div>
        <WorkOrderStatusBadge
          status={workOrder.status}
          variant={workOrder.status_variant}
        />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Müşteri</dt>
          <dd className="text-right">
            <Link
              href={`/customers/${workOrder.customer_id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {workOrder.customer_name}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Cihaz</dt>
          <dd className="max-w-[60%] text-right text-muted-foreground">
            {workOrder.device_label ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Atanan</dt>
          <dd>{workOrder.assignee_name ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Planlanan</dt>
          <dd className="tabular-nums">
            {formatScheduledDate(workOrder.scheduled_date)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full",
          )}
        >
          Detay
        </Link>
      </div>
    </article>
  );
}

export function WorkOrderCardList({
  workOrders,
}: {
  workOrders: WorkOrderListItem[];
}) {
  if (workOrders.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {workOrders.map((wo) => (
        <WorkOrderCard key={wo.id} workOrder={wo} />
      ))}
    </div>
  );
}
