import { z } from "zod";

import {
  NOTIFICATION_DROPDOWN_LIMIT,
  NOTIFICATION_READ_STATUSES,
  NOTIFICATION_TYPES,
  NOTIFICATIONS_PAGE_LIMIT,
} from "@/lib/constants/notifications";

export const notificationSearchSchema = z.object({
  status: z.enum(NOTIFICATION_READ_STATUSES).default("all"),
  type: z.enum(["all", ...NOTIFICATION_TYPES]).default("all"),
});

export type NotificationSearchInput = z.infer<typeof notificationSearchSchema>;

export const getNotificationsParamsSchema = z.object({
  status: z.enum(NOTIFICATION_READ_STATUSES).default("all"),
  type: z.enum(["all", ...NOTIFICATION_TYPES]).default("all"),
  limit: z.number().int().min(1).max(100).default(NOTIFICATIONS_PAGE_LIMIT),
  offset: z.number().int().min(0).default(0),
});

export type GetNotificationsParams = z.infer<typeof getNotificationsParamsSchema>;

export const dropdownNotificationsParamsSchema = z.object({
  limit: z.number().int().min(1).max(20).default(NOTIFICATION_DROPDOWN_LIMIT),
});
