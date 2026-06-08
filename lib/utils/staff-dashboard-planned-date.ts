import { addDays, parseISO, startOfDay } from "date-fns";

import { SERVICE_REQUEST_DEFAULT_SLA_DAYS } from "@/lib/constants/service-request";

export {
  computePlannedDateUrgency,
  type PlannedDateUrgency,
} from "@/lib/utils/planned-date-urgency";

export function computeServiceRequestPlannedDate(createdAt: string): string {
  const created = startOfDay(parseISO(createdAt));
  return addDays(created, SERVICE_REQUEST_DEFAULT_SLA_DAYS)
    .toISOString()
    .slice(0, 10);
}
