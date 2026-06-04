import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

export type InsertNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
};

function startOfTodayIso(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function hasNotificationToday(
  admin: AdminClient,
  params: {
    userId: string;
    type: string;
    entityType?: string | null;
    entityId?: string | null;
    title?: string;
  },
): Promise<boolean> {
  let query = admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .gte("created_at", startOfTodayIso());

  if (params.entityType) {
    query = query.eq("entity_type", params.entityType);
  }

  if (params.entityId) {
    query = query.eq("entity_id", params.entityId);
  }

  if (params.title) {
    query = query.eq("title", params.title);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}

export async function insertNotification(
  admin: AdminClient,
  input: InsertNotificationInput,
): Promise<void> {
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    action_url: input.actionUrl ?? null,
    priority: input.priority ?? "normal",
    is_read: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}
