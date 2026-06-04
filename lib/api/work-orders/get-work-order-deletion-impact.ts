"use server";

import {
  assertCanAccessBranch,
  assertCanDelete,
  getWorkOrderApiContext,
} from "@/lib/api/work-orders/auth";
import type { WorkOrderDeletionImpact } from "@/lib/api/work-orders/types";

export async function getWorkOrderDeletionImpact(
  workOrderId: string,
): Promise<WorkOrderDeletionImpact> {
  const ctx = await getWorkOrderApiContext();
  assertCanDelete(ctx);

  const { data: workOrder, error } = await ctx.supabase
    .from("work_orders")
    .select("id, branch_id")
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!workOrder) {
    return {
      activityCount: 0,
      partCount: 0,
      photoCount: 0,
      fileCount: 0,
    };
  }

  assertCanAccessBranch(ctx, workOrder.branch_id);

  const [activities, parts, photos, files] = await Promise.all([
    ctx.supabase
      .from("work_order_activities")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId),
    ctx.supabase
      .from("work_order_parts")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId),
    ctx.supabase
      .from("work_order_photos")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId),
    ctx.supabase
      .from("work_order_files")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId)
      .is("deleted_at", null),
  ]);

  return {
    activityCount: activities.count ?? 0,
    partCount: parts.count ?? 0,
    photoCount: photos.count ?? 0,
    fileCount: files.count ?? 0,
  };
}
