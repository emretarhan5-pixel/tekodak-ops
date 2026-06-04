"use server";

import { getNotificationApiContext } from "@/lib/api/notifications/auth";
import { NotificationApiError } from "@/lib/api/notifications/auth.types";
import {
  mapNotificationRow,
  toNotificationError,
} from "@/lib/api/notifications/notification-helpers";
import type { NotificationsListResult } from "@/lib/api/notifications/types";
import type { NotificationType } from "@/lib/constants/notifications";
import {
  dropdownNotificationsParamsSchema,
  getNotificationsParamsSchema,
} from "@/schemas/notifications";

export async function getNotifications(
  rawParams?: {
    status?: "all" | "unread" | "read";
    type?: "all" | NotificationType;
    limit?: number;
    offset?: number;
  },
): Promise<NotificationsListResult> {
  try {
    const params = getNotificationsParamsSchema.parse(rawParams ?? {});
    const ctx = await getNotificationApiContext();

    let query = ctx.supabase
      .from("notifications")
      .select(
        "id, user_id, type, title, message, entity_type, entity_id, action_url, priority, is_read, read_at, created_at",
      )
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (params.status === "unread") {
      query = query.eq("is_read", false);
    } else if (params.status === "read") {
      query = query.eq("is_read", true);
    }

    if (params.type !== "all") {
      query = query.eq("type", params.type);
    }

    const [{ data, error }, unreadResult] = await Promise.all([
      query,
      ctx.supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("is_read", false),
    ]);

    if (error) {
      throw new NotificationApiError(error.message, "FORBIDDEN");
    }

    if (unreadResult.error) {
      throw new NotificationApiError(unreadResult.error.message, "FORBIDDEN");
    }

    return {
      items: (data ?? []).map(mapNotificationRow),
      unreadCount: unreadResult.count ?? 0,
    };
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }
    throw new NotificationApiError(toNotificationError(error), "FORBIDDEN");
  }
}

export async function getDropdownNotifications(): Promise<NotificationsListResult> {
  const params = dropdownNotificationsParamsSchema.parse({});
  return getNotifications({
    status: "all",
    limit: params.limit,
    offset: 0,
  });
}
