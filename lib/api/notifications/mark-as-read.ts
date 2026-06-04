"use server";

import { revalidatePath } from "next/cache";

import { getNotificationApiContext } from "@/lib/api/notifications/auth";
import { NotificationApiError } from "@/lib/api/notifications/auth.types";
import {
  NOTIFICATIONS_REVALIDATE_PATH,
  toNotificationError,
} from "@/lib/api/notifications/notification-helpers";
import type { ActionResult } from "@/lib/api/notifications/types";

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const ctx = await getNotificationApiContext();
    const now = new Date().toISOString();

    const { data, error } = await ctx.supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .select("id");

    if (error) {
      throw new NotificationApiError(error.message, "FORBIDDEN");
    }

    if (data && data.length > 0) {
      revalidatePath(NOTIFICATIONS_REVALIDATE_PATH);
      revalidatePath("/", "layout");
      return { success: true, data: undefined };
    }

    const { data: existing, error: fetchError } = await ctx.supabase
      .from("notifications")
      .select("id, is_read")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (fetchError) {
      throw new NotificationApiError(fetchError.message, "FORBIDDEN");
    }

    if (!existing) {
      return { success: false, error: "Bildirim bulunamadı" };
    }

    if (existing.is_read === true) {
      revalidatePath(NOTIFICATIONS_REVALIDATE_PATH);
      revalidatePath("/", "layout");
      return { success: true, data: undefined };
    }

    return { success: false, error: "Bildirim güncellenemedi" };
  } catch (error) {
    return { success: false, error: toNotificationError(error) };
  }
}
