import { addDays, differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

import type { StaffDashboardPlannedDateUrgency } from "@/lib/api/dashboard/types";
import { SERVICE_REQUEST_DEFAULT_SLA_DAYS } from "@/lib/constants/service-request";

export function computeServiceRequestPlannedDate(createdAt: string): string {
  const created = startOfDay(parseISO(createdAt));
  return addDays(created, SERVICE_REQUEST_DEFAULT_SLA_DAYS)
    .toISOString()
    .slice(0, 10);
}

export function computePlannedDateUrgency(
  plannedDateIso: string,
  referenceDate: Date = new Date(),
): { daysRemaining: number; urgency: StaffDashboardPlannedDateUrgency } {
  const planned = startOfDay(parseISO(plannedDateIso));
  const today = startOfDay(referenceDate);
  const daysRemaining = differenceInCalendarDays(planned, today);

  let urgency: StaffDashboardPlannedDateUrgency = "normal";
  if (daysRemaining <= 0) {
    urgency = "overdue";
  } else if (daysRemaining <= 2) {
    urgency = "urgent";
  } else if (daysRemaining <= 6) {
    urgency = "warning";
  }

  return { daysRemaining, urgency };
}
