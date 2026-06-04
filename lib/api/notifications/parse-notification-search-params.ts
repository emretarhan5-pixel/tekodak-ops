import { notificationSearchSchema } from "@/schemas/notifications";

export function parseNotificationSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const rawStatus = params.status;
  const rawType = params.type;

  const status =
    typeof rawStatus === "string"
      ? rawStatus
      : Array.isArray(rawStatus)
        ? rawStatus[0]
        : undefined;

  const type =
    typeof rawType === "string"
      ? rawType
      : Array.isArray(rawType)
        ? rawType[0]
        : undefined;

  return notificationSearchSchema.parse({ status, type });
}
