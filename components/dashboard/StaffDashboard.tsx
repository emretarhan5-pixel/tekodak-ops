"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Loader2,
  Play,
  Plus,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MaintenanceStatusBadge } from "@/components/contracts/maintenance-status-badge";
import { ServiceRequestStatusBadge } from "@/components/service-requests/service-request-status-badge";
import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  StaffDashboardData,
  StaffDashboardMaintenancePlanItem,
  StaffDashboardPlannedDateUrgency,
  StaffDashboardServiceRequestItem,
} from "@/lib/api/dashboard/types";
import { startMaintenancePlan } from "@/lib/api/maintenance/start-maintenance-plan";
import { WORK_ORDER_TYPE_LABELS } from "@/lib/constants/work-order";
import { cn } from "@/lib/utils";

type StaffDashboardProps = {
  data: StaffDashboardData;
};

const PLANNED_DATE_URGENCY_CLASSES: Record<
  StaffDashboardPlannedDateUrgency,
  string
> = {
  normal: "bg-card",
  warning:
    "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  urgent:
    "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40",
  overdue:
    "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
};

function formatPlannedDate(value: string): string {
  try {
    return format(parseISO(value), "d MMMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

function formatScheduledDate(value: string | null): string {
  if (!value) return "Planlanmadı";
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

function plannedDateHint(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} gün gecikti`;
  }
  if (daysRemaining === 0) {
    return "Bugün";
  }
  return `${daysRemaining} gün kaldı`;
}

function StaffServiceRequestCard({
  item,
}: {
  item: StaffDashboardServiceRequestItem;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4 shadow-xs transition-colors",
        PLANNED_DATE_URGENCY_CLASSES[item.urgency],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{item.request_number}</p>
          <p className="mt-1 truncate font-medium">{item.company_name}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {item.device_label}
          </p>
        </div>
        <ServiceRequestStatusBadge
          status={item.status}
          variant={item.status_variant}
        />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p className="font-medium text-foreground">{item.step_label}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">Planlanan tarih</span>
          <span className="font-medium tabular-nums">
            {formatPlannedDate(item.planned_date)}
          </span>
        </div>
        <p
          className={cn(
            "text-xs font-medium",
            item.urgency === "overdue" && "text-red-700 dark:text-red-300",
            item.urgency === "urgent" && "text-orange-700 dark:text-orange-300",
            item.urgency === "warning" && "text-amber-700 dark:text-amber-300",
            item.urgency === "normal" && "text-muted-foreground",
          )}
        >
          {plannedDateHint(item.days_remaining)}
        </p>
      </div>

      <Link
        href={`/service-requests/${item.id}`}
        className={cn(
          buttonVariants({ variant: "default", size: "sm" }),
          "mt-4 h-10 w-full gap-2",
        )}
      >
        Devam Et
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function StaffMaintenancePlanCard({
  item,
}: {
  item: StaffDashboardMaintenancePlanItem;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const isPlanned = item.status === "planned";
  const actionLabel = isPlanned ? "Başlat" : "Devam Et";

  async function handleAction() {
    if (!isPlanned) {
      router.push(`/maintenance/${item.id}`);
      return;
    }

    setStarting(true);

    try {
      const result = await startMaintenancePlan({ plan_id: item.id });

      if (!result.success) {
        toast.error(result.error ?? "Bakım başlatılamadı");
        return;
      }

      router.push(`/maintenance/${item.id}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setStarting(false);
    }
  }

  return (
    <article
      className={cn(
        "rounded-xl border p-4 shadow-xs transition-colors",
        PLANNED_DATE_URGENCY_CLASSES[item.urgency],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{item.contract_number}</p>
          <p className="mt-1 truncate font-medium">{item.customer_name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {item.device_count} cihaz
          </p>
        </div>
        <MaintenanceStatusBadge
          status={item.status}
          variant={item.status_variant}
        />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">Planlanan tarih</span>
          <span className="font-medium tabular-nums">
            {formatPlannedDate(item.planned_date)}
          </span>
        </div>
        <p
          className={cn(
            "text-xs font-medium",
            item.urgency === "overdue" && "text-red-700 dark:text-red-300",
            item.urgency === "urgent" && "text-orange-700 dark:text-orange-300",
            item.urgency === "warning" && "text-amber-700 dark:text-amber-300",
            item.urgency === "normal" && "text-muted-foreground",
          )}
        >
          {plannedDateHint(item.days_remaining)}
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        className="mt-4 h-10 w-full gap-2"
        disabled={starting}
        onClick={handleAction}
      >
        {starting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isPlanned ? (
          <Play className="size-4" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        {starting ? "Başlatılıyor…" : actionLabel}
      </Button>
    </article>
  );
}

function StaffWorkOrderCard({
  item,
}: {
  item: StaffDashboardData["openWorkOrders"][number];
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">
            {item.work_order_number}
          </p>
          <p className="mt-1 truncate font-medium">{item.customer_name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {WORK_ORDER_TYPE_LABELS[item.work_type]}
          </p>
        </div>
        <WorkOrderStatusBadge
          status={item.status}
          variant={item.status_variant}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Planlanan</span>
        <span className="tabular-nums">
          {formatScheduledDate(item.scheduled_date)}
        </span>
      </div>

      <Link
        href={`/work-orders/${item.id}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-4 h-10 w-full gap-2",
        )}
      >
        Detay
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

export function StaffDashboard({ data }: StaffDashboardProps) {
  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Merhaba {data.userName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Açık servis talepleriniz, bakımlarınız ve iş emirleriniz
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="size-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Açık Servis Taleplerim
          </h2>
          <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {data.summary.openServiceRequestsCount}
          </span>
        </div>

        {data.openServiceRequests.length === 0 ? (
          <EmptySection message="Açık servis talebiniz yok." />
        ) : (
          <div className="grid gap-3">
            {data.openServiceRequests.map((item) => (
              <StaffServiceRequestCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Bakımlarım
          </h2>
          <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {data.summary.openMaintenancePlansCount}
          </span>
        </div>

        {data.openMaintenancePlans.length === 0 ? (
          <EmptySection message="Atanmış bakım planın yok." />
        ) : (
          <div className="grid gap-3">
            {data.openMaintenancePlans.map((item) => (
              <StaffMaintenancePlanCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Açık İş Emirlerim
          </h2>
          <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {data.summary.openWorkOrdersCount}
          </span>
        </div>

        {data.openWorkOrders.length === 0 ? (
          <EmptySection message="Açık iş emriniz yok." />
        ) : (
          <div className="grid gap-3">
            {data.openWorkOrders.map((item) => (
              <StaffWorkOrderCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <Link
        href="/service-requests/new"
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-14 w-full gap-2 text-base font-bold uppercase tracking-wide shadow-sm",
        )}
      >
        <Plus className="size-5" />
        YENİ SERVİS TALEBİ AÇ
      </Link>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Özet</CardTitle>
          <CardDescription>Bu ayki performansınız</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Bu ay tamamlanan servis
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.summary.completedServiceRequestsThisMonth}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Açık talepler</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.summary.openServiceRequestsCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Açık bakım</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.summary.openMaintenancePlansCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Açık iş emirleri</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.summary.openWorkOrdersCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
