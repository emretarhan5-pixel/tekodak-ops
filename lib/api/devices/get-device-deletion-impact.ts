"use server";

import {
  assertCanAccessCustomerBranch,
  assertCanDelete,
  getDeviceApiContext,
} from "@/lib/api/devices/auth";
import type { DeviceDeletionImpact } from "@/lib/api/devices/types";

export async function getDeviceDeletionImpact(
  deviceId: string,
): Promise<DeviceDeletionImpact> {
  const ctx = await getDeviceApiContext();
  assertCanDelete(ctx);

  const { data: device, error } = await ctx.supabase
    .from("devices")
    .select(
      `
      id,
      customers!devices_customer_id_fkey!inner ( branch_id )
    `,
    )
    .eq("id", deviceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!device) {
    return { openWorkOrders: 0 };
  }

  const row = device as typeof device & {
    customers: { branch_id: string };
  };

  assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

  const { count } = await ctx.supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("device_id", deviceId)
    .in("status", ["new", "assigned", "in_progress", "on_hold"])
    .is("deleted_at", null);

  return { openWorkOrders: count ?? 0 };
}
