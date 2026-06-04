import type {
  TargetDisplayStatus,
  TargetProgressStatus,
  TargetStatus,
} from "@/lib/constants/target";
import {
  TARGET_DISPLAY_STATUS_LABELS,
} from "@/lib/constants/target";

export function computeCompletionPercentage(
  currentValue: number,
  targetValue: number,
): number {
  if (targetValue <= 0) {
    return 0;
  }
  return Math.round((currentValue / targetValue) * 1000) / 10;
}

export function computeTargetDisplayStatus(
  status: TargetStatus,
  endDate: string,
  completionPercentage: number,
): { display_status: TargetDisplayStatus; display_status_label: string } {
  if (status === "cancelled") {
    return {
      display_status: "inactive",
      display_status_label: "İptal",
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today && completionPercentage < 100) {
    return {
      display_status: "inactive",
      display_status_label: "Süre Doldu",
    };
  }

  if (completionPercentage >= 100) {
    return {
      display_status: "achieved",
      display_status_label: TARGET_DISPLAY_STATUS_LABELS.achieved,
    };
  }

  if (completionPercentage >= 50) {
    return {
      display_status: "in_progress",
      display_status_label: TARGET_DISPLAY_STATUS_LABELS.in_progress,
    };
  }

  return {
    display_status: "behind",
    display_status_label: TARGET_DISPLAY_STATUS_LABELS.behind,
  };
}

export function deriveProgressStatus(
  endDate: string,
  targetValue: number,
  currentValue: number,
): TargetProgressStatus {
  const completion = computeCompletionPercentage(currentValue, targetValue);
  const today = new Date().toISOString().slice(0, 10);

  if (today > endDate) {
    return "finished";
  }
  if (currentValue >= targetValue) {
    return "achieved";
  }
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(endDate).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  if (daysRemaining <= 7 && completion < 90) {
    return "at_risk";
  }
  return "on_track";
}

export function formatTargetMetricValue(
  metricType: string,
  value: number,
): string {
  if (metricType === "revenue_contracts") {
    return `${new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)} ₺`;
  }

  if (metricType === "response_time") {
    return `${new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value)} sa`;
  }

  if (metricType === "first_time_fix") {
    return `%${new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value)}`;
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTargetMetricValueForDetail(
  metricType: string,
  value: number,
  rewardConfig: { currency?: string } | null | undefined,
): string {
  if (metricType === "revenue_contracts") {
    const currency = rewardConfig?.currency === "EUR" ? "EUR" : "TRY";
    const formatted = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
    return currency === "EUR" ? `${formatted} €` : `${formatted} ₺`;
  }

  return formatTargetMetricValue(metricType, value);
}

export function formatTargetDaysRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return "Süre doldu";
  }
  if (daysRemaining === 0) {
    return "Bugün bitiyor";
  }
  return `${daysRemaining} gün kaldı`;
}

export function getProgressBarColorClass(
  displayStatus: TargetDisplayStatus,
): string {
  switch (displayStatus) {
    case "achieved":
      return "bg-emerald-500";
    case "in_progress":
      return "bg-amber-500";
    case "behind":
      return "bg-red-500";
    case "inactive":
    default:
      return "bg-muted-foreground/40";
  }
}
