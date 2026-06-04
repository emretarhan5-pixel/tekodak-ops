"use server";

import { getNotificationApiContext } from "@/lib/api/notifications/auth";
import { NotificationApiError } from "@/lib/api/notifications/auth.types";

export async function getUnreadCount(): Promise<number> {
  const ctx = await getNotificationApiContext();

  const { count, error } = await ctx.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id)
    .eq("is_read", false);

  if (error) {
    throw new NotificationApiError(error.message, "FORBIDDEN");
  }

  return count ?? 0;
}
