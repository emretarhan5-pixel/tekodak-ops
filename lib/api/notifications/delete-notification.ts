"use server";

import { revalidatePath } from "next/cache";

import { getNotificationApiContext } from "@/lib/api/notifications/auth";
import { NotificationApiError } from "@/lib/api/notifications/auth.types";
import {
  NOTIFICATIONS_REVALIDATE_PATH,
  toNotificationError,
} from "@/lib/api/notifications/notification-helpers";
import type { ActionResult } from "@/lib/api/notifications/types";

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const ctx = await getNotificationApiContext();

    const { data, error } = await ctx.supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new NotificationApiError(error.message, "FORBIDDEN");
    }

    if (!data) {
      return { success: false, error: "Bildirim bulunamadı" };
    }

    revalidatePath(NOTIFICATIONS_REVALIDATE_PATH);
    revalidatePath("/", "layout");

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toNotificationError(error) };
  }
}
