"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";
import { insertWorkOrderActivity } from "@/lib/api/work-orders/work-order-helpers";
import { isTerminalWorkOrderStatus } from "@/lib/api/work-orders/work-order-status";
import {
  needsAssignedBeforeStart,
  resolveStatusAfterAction,
  type WorkOrderStatusAction,
} from "@/lib/api/work-orders/work-order-status-actions";
import type { TablesUpdate } from "@/lib/supabase/types";
import {
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderStatus,
} from "@/lib/constants/work-order";

export async function updateWorkOrderStatus(
  workOrderId: string,
  action: WorkOrderStatusAction,
  cancellationReason?: string | null,
): Promise<ActionResult<{ workOrderId: string; status: WorkOrderStatus }>> {
  try {
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("work_orders")
      .select(
        `
        id,
        status,
        assigned_to,
        customer_id,
        device_id,
        contract_id,
        branch_id
      `,
      )
      .eq("id", workOrderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);

    const currentStatus = existing.status as WorkOrderStatus;

    if (isTerminalWorkOrderStatus(currentStatus)) {
      return {
        success: false,
        error: "Tamamlanmış veya iptal edilmiş iş emrinin durumu değiştirilemez",
      };
    }

    if (action === "start" && currentStatus === "new" && !existing.assigned_to) {
      return {
        success: false,
        error: "İşe başlamak için önce personel atayın (düzenle)",
      };
    }

    const nextStatus = resolveStatusAfterAction(currentStatus, action);

    if (!nextStatus) {
      return {
        success: false,
        error: "Bu durum geçişi geçerli değil",
      };
    }

    if (action === "cancel") {
      const reason = cancellationReason?.trim();
      if (!reason) {
        return {
          success: false,
          error: "İptal gerekçesi girin",
        };
      }
    }

    const now = new Date().toISOString();
    let statusBeforeProgress = currentStatus;

    if (action === "start" && needsAssignedBeforeStart(currentStatus)) {
      const { error: assignStepError } = await ctx.supabase
        .from("work_orders")
        .update({
          status: "assigned",
          assigned_at: existing.assigned_to ? now : null,
          updated_by: ctx.user.id,
        })
        .eq("id", workOrderId);

      if (assignStepError) {
        throw new Error(assignStepError.message);
      }

      statusBeforeProgress = "assigned";
    }

    const patch: TablesUpdate<"work_orders"> = {
      status: nextStatus,
      updated_by: ctx.user.id,
    };

    if (action === "cancel") {
      patch.cancelled_at = now;
      patch.cancelled_by = ctx.user.id;
      patch.cancellation_reason = cancellationReason!.trim();
    }

    const { error: updateError } = await ctx.supabase
      .from("work_orders")
      .update(patch)
      .eq("id", workOrderId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const activityType =
      action === "cancel"
        ? "cancelled"
        : action === "complete"
          ? "completed"
          : action === "start"
            ? statusBeforeProgress === "on_hold"
              ? "resumed"
              : "started"
            : "status_changed";

    const description =
      action === "cancel"
        ? `İş emri iptal edildi: ${cancellationReason!.trim()}`
        : `Durum: ${WORK_ORDER_STATUS_LABELS[currentStatus]} → ${WORK_ORDER_STATUS_LABELS[nextStatus]}`;

    await insertWorkOrderActivity(ctx.supabase, {
      workOrderId,
      userId: ctx.user.id,
      activityType,
      description,
      oldValue: { status: currentStatus },
      newValue: { status: nextStatus },
    });

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/customers/${existing.customer_id}`);
    if (existing.device_id) {
      revalidatePath(`/devices/${existing.device_id}`);
    }
    if (existing.contract_id) {
      revalidatePath(`/contracts/${existing.contract_id}`);
    }

    return {
      success: true,
      data: { workOrderId, status: nextStatus },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
