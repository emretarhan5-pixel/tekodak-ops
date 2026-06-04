"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, Clock3, Pencil, Target, User } from "lucide-react";
import Link from "next/link";

import {
  CancelTargetButton,
  DeleteTargetButton,
} from "@/components/targets/TargetActionButtons";
import { TargetDisplayStatusBadge } from "@/components/targets/target-display-status-badge";
import { getProgressBarColorClass } from "@/lib/api/targets/target-progress-display";
import {
  formatTargetDaysRemaining,
  formatTargetMetricValueForDetail,
} from "@/lib/api/targets/target-progress-display";
import type {
  CancelTargetAction,
  DeleteTargetAction,
  TargetDetail,
} from "@/lib/api/targets/types";
import {
  getTargetMetricDisplayLabel,
  TARGET_PERIOD_TYPE_LABELS,
  TARGET_STATUS_LABELS,
} from "@/lib/constants/target";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TargetDetailProps = {
  target: TargetDetail;
  canEdit: boolean;
  cancelTargetAction: CancelTargetAction;
  deleteTargetAction: DeleteTargetAction;
};

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "d MMMM yyyy", { locale: tr });
  } catch {
    return value;
  }
}

function InfoRow({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-center">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-medium break-words",
          large ? "text-2xl font-semibold tabular-nums" : "text-sm",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function TargetDetail({
  target,
  canEdit,
  cancelTargetAction,
  deleteTargetAction,
}: TargetDetailProps) {
  const isCancelled = target.status === "cancelled";
  const progressClamped = Math.min(Math.max(target.completion_percentage, 0), 100);

  const formattedTargetValue = formatTargetMetricValueForDetail(
    target.metric_type,
    target.target_value,
    target.reward_config,
  );
  const formattedCurrentValue = formatTargetMetricValueForDetail(
    target.metric_type,
    target.current_value,
    target.reward_config,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/targets"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1 px-0",
          )}
        >
          <ChevronLeft className="size-4" />
          Hedeflere dön
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="size-5 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight">{target.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{getTargetMetricDisplayLabel(target.metric_type)}</span>
              <span>·</span>
              <span>{TARGET_PERIOD_TYPE_LABELS[target.period_type]}</span>
              <span>·</span>
              <span>
                {target.branch_name} ({target.branch_code})
              </span>
              <span>·</span>
              <span>{TARGET_STATUS_LABELS[target.status]}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <TargetDisplayStatusBadge
                displayStatus={target.display_status}
                label={target.display_status_label}
              />
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                {formatTargetDaysRemaining(target.days_remaining)}
              </span>
              {target.assignee ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="size-4" />
                  {target.assignee.full_name}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && !isCancelled ? (
              <Link
                href={`/targets/${target.id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Pencil className="size-4" />
                Düzenle
              </Link>
            ) : null}
            {!isCancelled ? (
              <CancelTargetButton
                targetId={target.id}
                targetName={target.name}
                cancelTargetAction={cancelTargetAction}
              />
            ) : null}
            <DeleteTargetButton
              targetId={target.id}
              targetName={target.name}
              deleteTargetAction={deleteTargetAction}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İlerleme</CardTitle>
          <CardDescription>
            Mevcut değer otomatik hesaplanır; manuel giriş yapılmaz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Mevcut / Hedef</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formattedCurrentValue}
                <span className="mx-2 text-lg text-muted-foreground">/</span>
                {formattedTargetValue}
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              }).format(target.completion_percentage)}
              %
            </p>
          </div>

          <div className="h-4 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                getProgressBarColorClass(target.display_status),
              )}
              style={{ width: `${progressClamped}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" />
              Dönem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <InfoRow label="Başlangıç" value={formatDate(target.start_date)} />
              <InfoRow label="Bitiş" value={formatDate(target.end_date)} />
              <InfoRow
                label="Kalan süre"
                value={formatTargetDaysRemaining(target.days_remaining)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Değerler</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <InfoRow
                label="Hedef değer"
                value={formattedTargetValue}
                large
              />
              <InfoRow
                label="Mevcut değer"
                value={formattedCurrentValue}
                large
              />
              <InfoRow
                label="İlerleme"
                value={`${new Intl.NumberFormat("tr-TR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                }).format(target.completion_percentage)}%`}
                large
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {target.previous_period_comparison ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benzer Dönem Karşılaştırması</CardTitle>
            <CardDescription>
              Aynı metrik ve dönem tipindeki bir önceki hedef
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <InfoRow
                label="Önceki hedef"
                value={target.previous_period_comparison.name}
              />
              <InfoRow
                label="Bitiş tarihi"
                value={formatDate(target.previous_period_comparison.end_date)}
              />
              <InfoRow
                label="Tamamlanma"
                value={`${new Intl.NumberFormat("tr-TR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                }).format(target.previous_period_comparison.completion_percentage)}%`}
                large
              />
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {target.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Açıklama</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {target.description}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kayıt bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <InfoRow label="Oluşturan" value={target.created_by_name} />
            <InfoRow
              label="Oluşturulma"
              value={formatDate(target.created_at.slice(0, 10))}
            />
            {target.updated_at ? (
              <InfoRow
                label="Son güncelleme"
                value={formatDate(target.updated_at.slice(0, 10))}
              />
            ) : null}
            <InfoRow
              label="Atanan personel"
              value={target.assignee?.full_name ?? "Şube geneli"}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
