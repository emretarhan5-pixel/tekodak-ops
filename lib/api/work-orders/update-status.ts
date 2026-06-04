"use server";

import type { ActionResult } from "@/lib/api/work-orders/types";
import { updateWorkOrderStatus } from "@/lib/api/work-orders/update-work-order-status";
import type { WorkOrderStatus } from "@/lib/constants/work-order";
import type { WorkOrderStatusAction } from "@/lib/api/work-orders/work-order-status-actions";

export async function updateStatus(
  workOrderId: string,
  action: WorkOrderStatusAction,
  cancellationReason?: string | null,
): Promise<ActionResult<{ workOrderId: string; status: WorkOrderStatus }>> {
  return updateWorkOrderStatus(workOrderId, action, cancellationReason);
}
