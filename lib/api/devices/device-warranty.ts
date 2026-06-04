import { differenceInCalendarDays } from "date-fns";

import type { WarrantyBadge } from "@/lib/api/devices/types";

export function computeWarrantyBadge(
  warrantyEndDate: string | null | undefined,
  today: Date = new Date(),
): WarrantyBadge {
  if (!warrantyEndDate) {
    return "expired";
  }

  const end = new Date(warrantyEndDate);
  if (Number.isNaN(end.getTime())) {
    return "expired";
  }

  const days = differenceInCalendarDays(end, today);

  if (days < 0) {
    return "expired";
  }
  if (days <= 30) {
    return "critical_30";
  }
  if (days <= 90) {
    return "warning_90";
  }
  return "active";
}

export function warrantyBadgeMatchesFilter(
  badge: WarrantyBadge,
  filter: "active" | "warning_90" | "critical_30" | "expired",
): boolean {
  return badge === filter;
}
