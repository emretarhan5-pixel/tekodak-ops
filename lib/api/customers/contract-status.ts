import { differenceInCalendarDays, parseISO } from "date-fns";

import type { CustomerContractBadge } from "@/lib/api/customers/types";

type ContractRow = {
  status: string;
  end_date: string;
};

const BADGE_PRIORITY: Record<CustomerContractBadge, number> = {
  none: 0,
  expired: 1,
  active: 2,
  renewal_soon: 3,
  expiring_soon: 4,
};

export function computeContractBadge(
  contract: ContractRow,
  today: Date = new Date(),
): CustomerContractBadge {
  const terminal = ["expired", "cancelled", "renewed"];
  if (terminal.includes(contract.status)) {
    return "expired";
  }

  if (contract.status === "expiring_soon") {
    return "expiring_soon";
  }

  if (contract.status === "renewal_approaching") {
    return "renewal_soon";
  }

  if (contract.status === "draft") {
    return "none";
  }

  if (contract.status === "active") {
    const days = differenceInCalendarDays(
      parseISO(contract.end_date),
      today,
    );
    if (days < 0) return "expired";
    if (days <= 30) return "expiring_soon";
    if (days <= 90) return "renewal_soon";
    return "active";
  }

  return "none";
}

export function worstContractBadge(
  contracts: ContractRow[],
  today?: Date,
): CustomerContractBadge {
  if (contracts.length === 0) {
    return "none";
  }

  let worst: CustomerContractBadge = "none";
  let maxPriority = -1;

  for (const contract of contracts) {
    const badge = computeContractBadge(contract, today);
    const priority = BADGE_PRIORITY[badge];
    if (priority > maxPriority) {
      maxPriority = priority;
      worst = badge;
    }
  }

  return worst;
}

export function contractBadgeMatchesFilter(
  badge: CustomerContractBadge,
  filter: CustomerContractBadge,
): boolean {
  return badge === filter;
}

/** Customer IDs whose worst contract badge matches the filter. */
export function filterCustomerIdsByContractBadge(
  contractsByCustomer: Map<string, ContractRow[]>,
  filter: CustomerContractBadge,
): Set<string> {
  const ids = new Set<string>();

  if (filter === "none") {
    for (const [customerId, rows] of contractsByCustomer) {
      if (worstContractBadge(rows) === "none") {
        ids.add(customerId);
      }
    }
    return ids;
  }

  for (const [customerId, rows] of contractsByCustomer) {
    const badge = worstContractBadge(rows);
    if (filter === "renewal_soon") {
      if (badge === "renewal_soon" || badge === "expiring_soon") {
        ids.add(customerId);
      }
      continue;
    }
    if (badge === filter) {
      ids.add(customerId);
    }
  }

  return ids;
}
