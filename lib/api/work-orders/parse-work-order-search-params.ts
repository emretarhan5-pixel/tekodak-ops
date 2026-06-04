import {
  WORK_ORDER_LIST_PAGE_SIZE,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_TYPES,
} from "@/lib/constants/work-order";
import {
  workOrderFilterSchema,
  type WorkOrderFilterInput,
} from "@/schemas/work-order";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

export function parseWorkOrderSearchParams(
  params: Record<string, string | string[] | undefined>,
): WorkOrderFilterInput {
  const status = pickString(params, "status");
  const workType = pickString(params, "workType");
  const priority = pickString(params, "priority");

  return workOrderFilterSchema.parse({
    search: pickString(params, "search"),
    branchId: pickString(params, "branchId"),
    customerId: pickString(params, "customerId"),
    deviceId: pickString(params, "deviceId"),
    status:
      status && (WORK_ORDER_STATUSES as readonly string[]).includes(status)
        ? (status as (typeof WORK_ORDER_STATUSES)[number])
        : undefined,
    workType:
      workType && (WORK_ORDER_TYPES as readonly string[]).includes(workType)
        ? (workType as (typeof WORK_ORDER_TYPES)[number])
        : undefined,
    priority:
      priority &&
      (WORK_ORDER_PRIORITIES as readonly string[]).includes(priority)
        ? (priority as (typeof WORK_ORDER_PRIORITIES)[number])
        : undefined,
    assignedTo: pickString(params, "assignedTo"),
    dateFrom: pickString(params, "dateFrom"),
    dateTo: pickString(params, "dateTo"),
    page: pickString(params, "page") ?? "1",
    pageSize:
      pickString(params, "pageSize") ?? String(WORK_ORDER_LIST_PAGE_SIZE),
  });
}
