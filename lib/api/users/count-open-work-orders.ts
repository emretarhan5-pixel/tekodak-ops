"use server";

import { getAdminUserContext } from "@/lib/api/users/auth";
import { createClient } from "@/lib/supabase/server";

const OPEN_WORK_ORDER_STATUSES = [
  "new",
  "assigned",
  "in_progress",
  "on_hold",
] as const;

export async function getOpenWorkOrdersForUser(
  userId: string,
): Promise<number> {
  await getAdminUserContext();
  return countOpenWorkOrdersForUser(userId);
}

async function countOpenWorkOrdersForUser(
  userId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .in("status", [...OPEN_WORK_ORDER_STATUSES])
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
