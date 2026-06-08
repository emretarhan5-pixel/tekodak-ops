"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, Plus, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MaintenanceStatusBadge } from "@/components/contracts/maintenance-status-badge";
import { PlanMaintenanceModal } from "@/components/contracts/PlanMaintenanceModal";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ContractDetail } from "@/lib/api/contracts/types";
import type { MaintenancePlanListItem } from "@/lib/api/maintenance/types";
import { OPEN_MAINTENANCE_PLAN_STATUSES } from "@/lib/constants/maintenance";
import type { PlannedDateUrgency } from "@/lib/utils/planned-date-urgency";
import { plannedDateHint } from "@/lib/utils/planned-date-urgency";
import { cn } from "@/lib/utils";

type ContractMaintenancePlanProps = {
  contract: ContractDetail;
  maintenancePlans: MaintenancePlanListItem[];
  canEdit: boolean;
  currentUserId: string;
  isAdmin: boolean;
};

const URGENCY_ROW_CLASSES: Record<PlannedDateUrgency, string> = {
  normal: "",
  warning:
    "border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
  urgent:
    "border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20",
  overdue: "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20",
};

function formatPlannedDate(value: string): string {
  try {
    return format(parseISO(value), "d MMMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

function PlanRow({
  plan,
  onNavigate,
}: {
  plan: MaintenancePlanListItem;
  onNavigate: (planId: string) => void;
}) {
  const isCompleted = plan.status === "completed";
  const urgencyClass = isCompleted ? "" : URGENCY_ROW_CLASSES[plan.urgency];

  return (
    <TableRow
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        urgencyClass,
        isCompleted && "bg-emerald-50/40 dark:bg-emerald-950/20",
      )}
      onClick={() => onNavigate(plan.id)}
    >
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Check
              className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
          ) : null}
          <span className="font-medium">{formatPlannedDate(plan.planned_date)}</span>
        </div>
        {!isCompleted ? (
          <p
            className={cn(
              "mt-0.5 text-xs",
              plan.urgency === "overdue" && "text-red-700 dark:text-red-300",
              plan.urgency === "urgent" && "text-orange-700 dark:text-orange-300",
              plan.urgency === "warning" && "text-amber-700 dark:text-amber-300",
              plan.urgency === "normal" && "text-muted-foreground",
            )}
          >
            {plannedDateHint(plan.days_remaining)}
          </p>
        ) : null}
      </TableCell>
      <TableCell>{plan.technician_name}</TableCell>
      <TableCell>
        <MaintenanceStatusBadge
          status={plan.status}
          variant={plan.status_variant}
        />
      </TableCell>
      <TableCell className="tabular-nums">
        {plan.completed_device_count}/{plan.device_count} cihaz
      </TableCell>
    </TableRow>
  );
}

function PlanCard({
  plan,
  onNavigate,
}: {
  plan: MaintenancePlanListItem;
  onNavigate: (planId: string) => void;
}) {
  const isCompleted = plan.status === "completed";

  return (
    <button
      type="button"
      onClick={() => onNavigate(plan.id)}
      className={cn(
        "w-full rounded-xl border p-4 text-left shadow-xs transition-colors hover:bg-muted/40",
        !isCompleted && URGENCY_ROW_CLASSES[plan.urgency],
        isCompleted && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : null}
            <p className="font-medium">{formatPlannedDate(plan.planned_date)}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.technician_name}
          </p>
        </div>
        <MaintenanceStatusBadge
          status={plan.status}
          variant={plan.status_variant}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="tabular-nums text-muted-foreground">
          {plan.completed_device_count}/{plan.device_count} cihaz
        </span>
        {!isCompleted ? (
          <span
            className={cn(
              "text-xs font-medium",
              plan.urgency === "overdue" && "text-red-700 dark:text-red-300",
              plan.urgency === "urgent" && "text-orange-700 dark:text-orange-300",
              plan.urgency === "warning" && "text-amber-700 dark:text-amber-300",
              plan.urgency === "normal" && "text-muted-foreground",
            )}
          >
            {plannedDateHint(plan.days_remaining)}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function ContractMaintenancePlan({
  contract,
  maintenancePlans,
  canEdit,
  currentUserId,
  isAdmin,
}: ContractMaintenancePlanProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const total = contract.total_maintenance_count;
  const completed = contract.completed_maintenance_count;
  const displayRemaining = Math.max(total - completed, 0);
  const progressPercent =
    total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const openPlanCount = useMemo(
    () =>
      maintenancePlans.filter((plan) =>
        (OPEN_MAINTENANCE_PLAN_STATUSES as readonly string[]).includes(
          plan.status,
        ),
      ).length,
    [maintenancePlans],
  );

  const scheduleRemaining = total - completed - openPlanCount;
  const canPlanNew = canEdit && total > 0 && scheduleRemaining > 0;

  const disabledReason =
    total === 0
      ? "Bakım sayısı henüz belirlenmemiş"
      : scheduleRemaining <= 0
        ? "Tüm bakım hakları kullanıldı"
        : null;

  function handleNavigate(planId: string) {
    router.push(`/maintenance/${planId}`);
  }

  const planButton = (
    <Button
      size="sm"
      className="gap-1.5 shrink-0"
      disabled={!canPlanNew}
      onClick={() => setModalOpen(true)}
    >
      <Plus className="size-4" />
      Yeni Bakım Planla
    </Button>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bakım özeti</CardTitle>
          <CardDescription>
            Sözleşme kapsamındaki periyodik bakım hakları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {total === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Bakım sayısı henüz belirlenmemiş. Planlama yapabilmek için
              sözleşmeyi düzenleyip toplam bakım sayısını girin.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Toplam Bakım</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{total}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Tamamlanan</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {completed}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Kalan</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {displayRemaining}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="font-medium tabular-nums">%{progressPercent}</span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Bakım geçmişi</CardTitle>
            <CardDescription>
              Planlanan ve tamamlanan periyodik bakımlar
            </CardDescription>
          </div>
          {canEdit ? (
            disabledReason ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="inline-flex w-full sm:w-auto">
                        {planButton}
                      </span>
                    }
                  />
                  <TooltipContent>{disabledReason}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              planButton
            )
          ) : null}
        </CardHeader>
        <CardContent>
          {maintenancePlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
              <Wrench className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Bakım planı yok</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bu sözleşme için henüz periyodik bakım planlanmamış.
                </p>
              </div>
              {canEdit && canPlanNew ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" />
                  İlk bakımı planla
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Teknisyen</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Cihaz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenancePlans.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {maintenancePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <PlanMaintenanceModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          contractId={contract.id}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ) : null}
    </div>
  );
}
