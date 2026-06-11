import { OPEN_MAINTENANCE_PLAN_STATUSES } from "@/lib/constants/maintenance";
import { OPEN_SERVICE_REQUEST_STATUSES } from "@/lib/constants/service-request";

export const USER_OPEN_SERVICE_REQUEST_STATUSES = [
  ...OPEN_SERVICE_REQUEST_STATUSES,
] as const;

export const USER_OPEN_MAINTENANCE_PLAN_STATUSES = [
  ...OPEN_MAINTENANCE_PLAN_STATUSES,
] as const;
