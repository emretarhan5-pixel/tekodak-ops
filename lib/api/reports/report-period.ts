import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { tr } from "date-fns/locale";

import type { ReportPeriod } from "@/lib/constants/report";
import { REPORT_PERIOD_LABELS } from "@/lib/constants/report";
import type { ResolvedReportPeriod } from "@/schemas/report";

function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatPeriodLabel(from: string, to: string): string {
  try {
    const fromLabel = format(new Date(from), "d MMM yyyy", { locale: tr });
    const toLabel = format(new Date(to), "d MMM yyyy", { locale: tr });
    return `${fromLabel} – ${toLabel}`;
  } catch {
    return `${from} – ${to}`;
  }
}

export function resolveReportPeriod(
  period: ReportPeriod,
  dateFrom?: string,
  dateTo?: string,
  referenceDate: Date = new Date(),
): ResolvedReportPeriod {
  if (period === "custom" && dateFrom && dateTo) {
    return {
      from: dateFrom,
      to: dateTo,
      label: formatPeriodLabel(dateFrom, dateTo),
    };
  }

  let fromDate: Date;
  let toDate: Date;

  switch (period) {
    case "quarter":
      fromDate = startOfQuarter(referenceDate);
      toDate = endOfQuarter(referenceDate);
      break;
    case "year":
      fromDate = startOfYear(referenceDate);
      toDate = endOfYear(referenceDate);
      break;
    case "month":
    default:
      fromDate = startOfMonth(referenceDate);
      toDate = endOfMonth(referenceDate);
      break;
  }

  const from = toIsoDate(fromDate);
  const to = toIsoDate(toDate);

  return {
    from,
    to,
    label: `${REPORT_PERIOD_LABELS[period]} (${formatPeriodLabel(from, to)})`,
  };
}

export function isDateInPeriod(
  value: string | null | undefined,
  period: ResolvedReportPeriod,
): boolean {
  if (!value) return false;
  const date = value.slice(0, 10);
  return date >= period.from && date <= period.to;
}

export function isTimestampInPeriod(
  value: string | null | undefined,
  period: ResolvedReportPeriod,
): boolean {
  if (!value) return false;
  const date = value.slice(0, 10);
  return date >= period.from && date <= period.to;
}
