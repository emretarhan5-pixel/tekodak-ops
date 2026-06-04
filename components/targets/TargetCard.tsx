"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

import { TargetDisplayStatusBadge } from "@/components/targets/target-display-status-badge";
import { TargetProgressBar } from "@/components/targets/target-progress-bar";
import { buttonVariants } from "@/components/ui/button";
import { formatTargetMetricValue } from "@/lib/api/targets/target-progress-display";
import type { TargetListItem } from "@/lib/api/targets/types";
import {
  getTargetMetricDisplayLabel,
  TARGET_PERIOD_TYPE_LABELS,
} from "@/lib/constants/target";
import { cn } from "@/lib/utils";

function formatDateRange(start: string, end: string): string {
  try {
    const startLabel = format(parseISO(start), "d MMM yyyy", { locale: tr });
    const endLabel = format(parseISO(end), "d MMM yyyy", { locale: tr });
    return `${startLabel} – ${endLabel}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export function TargetCard({ target }: { target: TargetListItem }) {
  return (
    <Link
      href={`/targets/${target.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:bg-muted/30",
        target.status === "cancelled" && "opacity-60 bg-muted/20",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{target.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {getTargetMetricDisplayLabel(target.metric_type)}
          </p>
        </div>
        <TargetDisplayStatusBadge
          displayStatus={target.display_status}
          label={target.display_status_label}
        />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Dönem</dt>
          <dd className="text-right">
            {TARGET_PERIOD_TYPE_LABELS[target.period_type]}
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {formatDateRange(target.start_date, target.end_date)}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Şube</dt>
          <dd>
            {target.branch_name}{" "}
            <span className="text-muted-foreground">({target.branch_code})</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Hedef / Mevcut</dt>
          <dd className="text-right font-medium tabular-nums">
            {formatTargetMetricValue(target.metric_type, target.target_value)}
            {" / "}
            {formatTargetMetricValue(target.metric_type, target.current_value)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <TargetProgressBar
          percentage={target.completion_percentage}
          displayStatus={target.display_status}
        />
      </div>

      <div className="mt-4">
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none w-full",
          )}
        >
          Detay
        </span>
      </div>
    </Link>
  );
}

export function TargetCardList({ targets }: { targets: TargetListItem[] }) {
  if (targets.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {targets.map((target) => (
        <TargetCard key={target.id} target={target} />
      ))}
    </div>
  );
}
