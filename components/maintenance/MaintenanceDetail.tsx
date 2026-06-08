"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, ChevronLeft, Loader2, Play } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MaintenanceStatusBadge } from "@/components/contracts/maintenance-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import type {
  CompleteMaintenancePlanAction,
  MaintenancePlanDetail,
  MaintenancePlanDeviceItem,
  StartMaintenancePlanAction,
  UpdateMaintenanceDeviceAction,
} from "@/lib/api/maintenance/types";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import type { PlannedDateUrgency } from "@/lib/utils/planned-date-urgency";
import { plannedDateHint } from "@/lib/utils/planned-date-urgency";
import { cn } from "@/lib/utils";

type MaintenanceDetailProps = {
  plan: MaintenancePlanDetail;
  canEditPlan: boolean;
  startMaintenancePlanAction: StartMaintenancePlanAction;
  updateMaintenanceDeviceAction: UpdateMaintenanceDeviceAction;
  completeMaintenancePlanAction: CompleteMaintenancePlanAction;
};

type DeviceDraft = {
  work_notes: string;
  is_completed: boolean;
};

const URGENCY_BANNER_CLASSES: Record<PlannedDateUrgency, string> = {
  normal: "border-border bg-muted/40 text-foreground",
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
  urgent:
    "border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-100",
  overdue:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100",
};

const textareaClassName = cn(
  "flex min-h-[96px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

function formatPlannedDate(value: string): string {
  try {
    return format(parseISO(value), "d MMMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

function isTerminalStatus(status: MaintenancePlanStatus): boolean {
  return status === "completed" || status === "cancelled";
}

function draftsFromDevices(
  devices: MaintenancePlanDeviceItem[],
): Record<string, DeviceDraft> {
  return Object.fromEntries(
    devices.map((device) => [
      device.id,
      {
        work_notes: device.work_notes ?? "",
        is_completed: device.is_completed,
      },
    ]),
  );
}

function MaintenanceDeviceCard({
  device,
  draft,
  editable,
  saving,
  onDraftChange,
  onSave,
}: {
  device: MaintenancePlanDeviceItem;
  draft: DeviceDraft;
  editable: boolean;
  saving: boolean;
  onDraftChange: (next: DeviceDraft) => void;
  onSave: () => void;
}) {
  const savedNotes = device.work_notes ?? "";
  const isDirty =
    draft.work_notes !== savedNotes ||
    draft.is_completed !== device.is_completed;

  return (
    <Card
      className={cn(
        device.is_completed &&
          "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">
              {device.brand_name} {device.model_name}
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-sm">
              {device.serial_number}
            </CardDescription>
          </div>
          {device.is_completed ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Check className="size-3.5" aria-hidden />
              Tamamlandı
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel htmlFor={`work-notes-${device.id}`}>
            Yapılan iş notu
          </FieldLabel>
          {editable ? (
            <textarea
              id={`work-notes-${device.id}`}
              className={textareaClassName}
              rows={4}
              placeholder="Cihazda yapılan işlemleri yazın…"
              value={draft.work_notes}
              onChange={(event) =>
                onDraftChange({ ...draft, work_notes: event.target.value })
              }
              disabled={saving}
            />
          ) : (
            <p className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm whitespace-pre-wrap">
              {device.work_notes?.trim() || "—"}
            </p>
          )}
        </Field>

        {editable ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3">
            <Checkbox
              checked={draft.is_completed}
              onCheckedChange={(value) =>
                onDraftChange({ ...draft, is_completed: value === true })
              }
              disabled={saving}
            />
            <span className="text-sm font-medium">Tamamlandı</span>
          </label>
        ) : null}

        {editable ? (
          <Button
            type="button"
            variant={isDirty ? "default" : "outline"}
            className="h-11 min-h-11 w-full sm:w-auto"
            disabled={saving || !isDirty}
            onClick={onSave}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Kaydediliyor…
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MaintenanceDetail({
  plan,
  canEditPlan,
  startMaintenancePlanAction,
  updateMaintenanceDeviceAction,
  completeMaintenancePlanAction,
}: MaintenanceDetailProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, DeviceDraft>>(() =>
    draftsFromDevices(plan.devices),
  );
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savingDeviceId, setSavingDeviceId] = useState<string | null>(null);

  const isReadOnly = isTerminalStatus(plan.status);
  const devicesEditable = canEditPlan && plan.status === "in_progress";
  const showStart = canEditPlan && plan.status === "planned";
  const showComplete = canEditPlan && plan.status === "in_progress";

  useEffect(() => {
    setDrafts(draftsFromDevices(plan.devices));
  }, [plan.devices]);

  const hasUnsavedChanges = useMemo(
    () =>
      plan.devices.some((device) => {
        const draft = drafts[device.id];
        if (!draft) return false;
        return (
          draft.work_notes !== (device.work_notes ?? "") ||
          draft.is_completed !== device.is_completed
        );
      }),
    [plan.devices, drafts],
  );

  const allDevicesCompleted = plan.devices.every(
    (device) => device.is_completed,
  );

  async function handleStart() {
    setStarting(true);

    try {
      const result = await startMaintenancePlanAction({ plan_id: plan.id });

      if (!result.success) {
        toast.error(result.error ?? "Bakım başlatılamadı");
        return;
      }

      toast.success("Bakım başlatıldı");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setStarting(false);
    }
  }

  async function handleSaveDevice(device: MaintenancePlanDeviceItem) {
    const draft = drafts[device.id];
    if (!draft) return;

    setSavingDeviceId(device.id);

    try {
      const result = await updateMaintenanceDeviceAction({
        device_row_id: device.id,
        work_notes: draft.work_notes.trim() ? draft.work_notes.trim() : null,
        is_completed: draft.is_completed,
      });

      if (!result.success) {
        toast.error(result.error ?? "Cihaz kaydı güncellenemedi");
        return;
      }

      toast.success("Cihaz kaydı güncellendi");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setSavingDeviceId(null);
    }
  }

  async function handleComplete() {
    if (hasUnsavedChanges) {
      toast.error("Önce kaydedilmemiş cihaz değişikliklerini kaydedin");
      return;
    }

    if (!allDevicesCompleted) {
      toast.error("Tüm cihazları tamamlandı olarak işaretleyin");
      return;
    }

    setCompleting(true);

    try {
      const result = await completeMaintenancePlanAction({ plan_id: plan.id });

      if (!result.success) {
        toast.error(result.error ?? "Bakım tamamlanamadı");
      }
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setCompleting(false);
    }
  }

  const urgencyBannerClass = isReadOnly
    ? "border-border bg-muted/30 text-muted-foreground"
    : URGENCY_BANNER_CLASSES[plan.urgency];

  const bottomPadding = showComplete
    ? "pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-8"
    : "pb-8";

  return (
    <div className={cn("space-y-4", bottomPadding)}>
      <Link
        href={`/contracts/${plan.contract_id}?tab=maintenance`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1 px-0",
        )}
      >
        <ChevronLeft className="size-4" />
        Sözleşmeye dön
      </Link>

      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          urgencyBannerClass,
        )}
      >
        <p className="font-medium">
          Planlanan tarih: {formatPlannedDate(plan.planned_date)}
        </p>
        {!isReadOnly ? (
          <p className="mt-0.5 opacity-90">{plannedDateHint(plan.days_remaining)}</p>
        ) : plan.completed_at ? (
          <p className="mt-0.5 opacity-90" suppressHydrationWarning>
            Tamamlanma: {formatPlannedDate(plan.completed_at.slice(0, 10))}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Link
              href={`/contracts/${plan.contract_id}?tab=maintenance`}
              className="inline-block max-w-full break-all font-mono text-lg font-bold tracking-tight text-primary hover:underline sm:text-xl md:text-2xl"
            >
              {plan.contract_number}
            </Link>
            <p className="text-base text-muted-foreground break-words sm:text-lg">
              {plan.customer_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Teknisyen:{" "}
              <span className="font-medium text-foreground">
                {plan.technician_name}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Şube: {plan.branch_name}
            </p>
          </div>
          <MaintenanceStatusBadge
            status={plan.status}
            variant={plan.status_variant}
            className="self-start shrink-0"
          />
        </div>

        {plan.notes?.trim() ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Plan notları</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{plan.notes}</p>
            </CardContent>
          </Card>
        ) : null}

        {showStart ? (
          <Button
            type="button"
            size="lg"
            className="h-12 min-h-12 w-full gap-2 sm:w-auto"
            disabled={starting}
            onClick={handleStart}
          >
            {starting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Play className="size-5" />
            )}
            Bakıma Başla
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Cihazlar</h2>
          <p className="text-sm text-muted-foreground">
            {plan.devices.filter((d) => d.is_completed).length}/
            {plan.devices.length} tamamlandı
          </p>
        </div>

        {plan.devices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Bu planda cihaz bulunmuyor
            </CardContent>
          </Card>
        ) : (
          plan.devices.map((device) => (
            <MaintenanceDeviceCard
              key={device.id}
              device={device}
              draft={
                drafts[device.id] ?? {
                  work_notes: device.work_notes ?? "",
                  is_completed: device.is_completed,
                }
              }
              editable={devicesEditable}
              saving={savingDeviceId === device.id}
              onDraftChange={(next) =>
                setDrafts((current) => ({ ...current, [device.id]: next }))
              }
              onSave={() => handleSaveDevice(device)}
            />
          ))
        )}
      </div>

      {showComplete ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur supports-backdrop-filter:backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0 md:pb-0 md:shadow-none md:backdrop-blur-none">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              {allDevicesCompleted
                ? "Tüm cihazlar tamamlandı — bakımı kapatabilirsiniz"
                : "Tamamlamak için tüm cihazları işaretleyip kaydedin"}
            </p>
            <Button
              type="button"
              size="lg"
              className="h-12 min-h-12 w-full gap-2 sm:w-auto"
              disabled={completing}
              onClick={handleComplete}
            >
              {completing ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Check className="size-5" />
              )}
              Tamamla
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
