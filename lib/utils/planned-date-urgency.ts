import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export type PlannedDateUrgency = "normal" | "warning" | "urgent" | "overdue";

export function computePlannedDateUrgency(
  plannedDateIso: string,
  referenceDate: Date = new Date(),
): { daysRemaining: number; urgency: PlannedDateUrgency } {
  const planned = startOfDay(parseISO(plannedDateIso));
  const today = startOfDay(referenceDate);
  const daysRemaining = differenceInCalendarDays(planned, today);

  let urgency: PlannedDateUrgency = "normal";
  if (daysRemaining <= 0) {
    urgency = "overdue";
  } else if (daysRemaining <= 2) {
    urgency = "urgent";
  } else if (daysRemaining <= 6) {
    urgency = "warning";
  }

  return { daysRemaining, urgency };
}

export function plannedDateHint(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} gün gecikti`;
  }
  if (daysRemaining === 0) {
    return "Bugün";
  }
  return `${daysRemaining} gün kaldı`;
}
