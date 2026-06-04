import { differenceInCalendarDays, parseISO } from "date-fns";

import type { ContractRenewalBadge } from "@/lib/constants/contract";
import type { ContractStatus } from "@/lib/constants/contract";

const TERMINAL_STATUSES: ContractStatus[] = [
  "expired",
  "cancelled",
  "renewed",
];

export function computeDaysRemaining(
  endDate: string,
  today: Date = new Date(),
): number {
  return differenceInCalendarDays(parseISO(endDate), today);
}

export function computeContractRenewalBadge(
  status: ContractStatus,
  endDate: string,
  today: Date = new Date(),
): ContractRenewalBadge {
  if (TERMINAL_STATUSES.includes(status)) {
    return "ended";
  }

  if (status === "draft") {
    return "ended";
  }

  if (status === "expiring_soon") {
    return "critical_30";
  }

  if (status === "renewal_approaching") {
    return "warning_90";
  }

  const days = computeDaysRemaining(endDate, today);

  if (days < 0) {
    return "ended";
  }

  if (days <= 30) {
    return "critical_30";
  }

  if (days <= 90) {
    return "warning_90";
  }

  return "active";
}

export function renewalBadgeMatchesFilter(
  badge: ContractRenewalBadge,
  filter: ContractRenewalBadge,
): boolean {
  return badge === filter;
}

export function matchesContractListFilter(
  status: ContractStatus,
  badge: ContractRenewalBadge,
  filter: import("@/lib/constants/contract").ContractListFilter,
): boolean {
  switch (filter) {
    case "draft":
      return status === "draft";
    case "active":
      return status === "active";
    case "renewal_near":
      return badge === "warning_90" || badge === "critical_30";
    case "ended":
      return (
        status === "expired" ||
        status === "renewed" ||
        badge === "ended"
      );
    case "cancelled":
      return status === "cancelled";
    default:
      return true;
  }
}
