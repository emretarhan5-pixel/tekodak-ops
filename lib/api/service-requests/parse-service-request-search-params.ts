import {
  SERVICE_REQUEST_LIST_PAGE_SIZE,
  SERVICE_REQUEST_STATUSES,
} from "@/lib/constants/service-request";
import {
  serviceRequestFilterSchema,
  type ServiceRequestFilterInput,
} from "@/schemas/service-request";

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

export function parseServiceRequestSearchParams(
  params: Record<string, string | string[] | undefined>,
): ServiceRequestFilterInput {
  const status = pickString(params, "status");

  return serviceRequestFilterSchema.parse({
    search: pickString(params, "search"),
    branchId: pickString(params, "branchId"),
    status:
      status &&
      (SERVICE_REQUEST_STATUSES as readonly string[]).includes(status)
        ? (status as (typeof SERVICE_REQUEST_STATUSES)[number])
        : undefined,
    assignedTechnicianId: pickString(params, "assignedTechnicianId"),
    dateFrom: pickString(params, "dateFrom"),
    dateTo: pickString(params, "dateTo"),
    page: pickString(params, "page") ?? "1",
    pageSize:
      pickString(params, "pageSize") ?? String(SERVICE_REQUEST_LIST_PAGE_SIZE),
  });
}
