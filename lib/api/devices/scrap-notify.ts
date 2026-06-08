import {
  insertNotification,
  type InsertNotificationInput,
} from "@/lib/api/cron/notification-insert";
import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyAllAdmins(
  notification: Omit<InsertNotificationInput, "userId">,
): Promise<void> {
  const admin = createAdminClient();

  const { data: admins, error } = await admin
    .from("users")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of admins ?? []) {
    await insertNotification(admin, {
      ...notification,
      userId: row.id,
    });
  }
}

export async function notifyUser(
  userId: string,
  notification: Omit<InsertNotificationInput, "userId">,
): Promise<void> {
  const admin = createAdminClient();
  await insertNotification(admin, {
    ...notification,
    userId,
  });
}
