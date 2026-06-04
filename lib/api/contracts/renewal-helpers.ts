import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { z } from "zod";

import type { ContractStatus } from "@/lib/constants/contract";

export const RENEWABLE_STATUSES = [
  "active",
  "renewal_approaching",
  "expiring_soon",
] as const satisfies readonly ContractStatus[];

export type RenewableStatus = (typeof RENEWABLE_STATUSES)[number];

export const renewContractSchema = z.object({
  contractId: z.string().uuid(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir başlangıç tarihi girin"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir bitiş tarihi girin"),
});

export type RenewContractInput = z.infer<typeof renewContractSchema>;

export function suggestRenewalDates(
  startDate: string,
  endDate: string,
): { start_date: string; end_date: string } {
  const oldEnd = parseISO(endDate);
  const oldStart = parseISO(startDate);
  const durationDays = Math.max(
    differenceInCalendarDays(oldEnd, oldStart),
    1,
  );
  const newStart = addDays(oldEnd, 1);
  const newEnd = addDays(newStart, durationDays);
  return {
    start_date: newStart.toISOString().slice(0, 10),
    end_date: newEnd.toISOString().slice(0, 10),
  };
}

export function isRenewableStatus(status: ContractStatus): boolean {
  return RENEWABLE_STATUSES.includes(status as RenewableStatus);
}
