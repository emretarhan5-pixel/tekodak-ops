import { DEVICE_LIST_PAGE_SIZE, DEVICE_STATUSES } from "@/lib/constants/device";
import {
  WARRANTY_FILTER_VALUES,
  deviceFilterSchema,
  type DeviceFilterInput,
  type WarrantyFilterValue,
} from "@/schemas/device";

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

export function parseDeviceSearchParams(
  params: Record<string, string | string[] | undefined>,
): DeviceFilterInput {
  const warrantyStatus = pickString(params, "warrantyStatus");
  const status = pickString(params, "status");

  return deviceFilterSchema.parse({
    search: pickString(params, "search"),
    branchId: pickString(params, "branchId"),
    brandId: pickString(params, "brandId"),
    customerId: pickString(params, "customerId"),
    warrantyStatus:
      warrantyStatus &&
      (WARRANTY_FILTER_VALUES as readonly string[]).includes(warrantyStatus)
        ? (warrantyStatus as WarrantyFilterValue)
        : undefined,
    status:
      status && (DEVICE_STATUSES as readonly string[]).includes(status)
        ? (status as (typeof DEVICE_STATUSES)[number])
        : undefined,
    page: pickString(params, "page") ?? "1",
    pageSize:
      pickString(params, "pageSize") ?? String(DEVICE_LIST_PAGE_SIZE),
  });
}
