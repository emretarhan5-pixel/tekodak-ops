"use server";

import { revalidatePath } from "next/cache";

import { getNotificationApiContext } from "@/lib/api/notifications/auth";
import { NotificationApiError } from "@/lib/api/notifications/auth.types";
import {
  NOTIFICATIONS_REVALIDATE_PATH,
  toNotificationError,
} from "@/lib/api/notifications/notification-helpers";
import type { ActionResult } from "@/lib/api/notifications/types";

export async function markAllAsRead(): Promise<ActionResult<{ count: number }>> {
  try {
    const ctx = await getNotificationApiContext();
    const now = new Date().toISOString();

    const { data, error } = await ctx.supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .eq("user_id", ctx.user.id)
      .eq("is_read", false)
      .select("id");

    if (error) {
      throw new NotificationApiError(error.message, "FORBIDDEN");
    }

    revalidatePath(NOTIFICATIONS_REVALIDATE_PATH);
    revalidatePath("/", "layout");

    return { success: true, data: { count: data?.length ?? 0 } };
  } catch (error) {
    return { success: false, error: toNotificationError(error) };
  }
}
