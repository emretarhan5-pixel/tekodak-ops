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
import { triggerWorkOrderAssignedEmail } from "@/lib/email/trigger-work-order-assigned-email";
import {
  computeSlaDeadline,
  emptyToNull,
  insertWorkOrderActivity,
  validateWorkOrderRelations,
} from "@/lib/api/work-orders/work-order-helpers";
import { isTerminalWorkOrderStatus } from "@/lib/api/work-orders/work-order-status";
import {
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderStatus,
} from "@/lib/constants/work-order";
import type { TablesUpdate } from "@/lib/supabase/types";
import {
  workOrderEditFormSchema,
  type WorkOrderEditFormValues,
} from "@/schemas/work-order";

export async function updateWorkOrder(
  rawInput: WorkOrderEditFormValues,
): Promise<ActionResult<{ workOrderId: string }>> {
  try {
    const input = workOrderEditFormSchema.parse(rawInput);
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("work_orders")
      .select(
        `
        id,
        customer_id,
        device_id,
        contract_id,
        branch_id,
        status,
        priority,
        assigned_to
      `,
      )
      .eq("id", input.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);

    if (isTerminalWorkOrderStatus(existing.status as WorkOrderStatus)) {
      return {
        success: false,
        error: "Tamamlanmış veya iptal edilmiş iş emri düzenlenemez",
      };
    }

    const { branchId, contractSlaHours } = await validateWorkOrderRelations(
      ctx,
      input,
    );

    if (ctx.branchScope && branchId !== existing.branch_id) {
      return {
        success: false,
        error: "İş emrini başka şubedeki müşteriye taşıma yetkiniz yok",
      };
    }

    const now = new Date().toISOString();
    const slaDeadline = computeSlaDeadline(
      input.priority,
      contractSlaHours,
      new Date(),
    );

    const patch: TablesUpdate<"work_orders"> = {
      customer_id: input.customer_id,
      device_id: input.device_id,
      contract_id: input.contract_id,
      branch_id: branchId,
      work_type: input.work_type,
      priority: input.priority,
      status: input.status,
      problem_description: input.problem_description.trim(),
      assigned_to: input.assigned_to,
      scheduled_date: input.scheduled_date,
      scheduled_time: input.scheduled_time,
      service_location: emptyToNull(input.service_location),
      service_location_note: emptyToNull(input.service_location_note),
      internal_notes: emptyToNull(input.internal_notes),
      is_under_contract: Boolean(input.contract_id),
      sla_deadline: slaDeadline,
      updated_by: ctx.user.id,
    };

    if (input.assigned_to && input.assigned_to !== existing.assigned_to) {
      patch.assigned_at = now;
      patch.assigned_by = ctx.user.id;
    }

    if (!input.assigned_to && existing.assigned_to) {
      patch.assigned_at = null;
      patch.assigned_by = null;
    }

    const { error: updateError } = await ctx.supabase
      .from("work_orders")
      .update(patch)
      .eq("id", input.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (input.status !== existing.status) {
      await insertWorkOrderActivity(ctx.supabase, {
        workOrderId: input.id,
        userId: ctx.user.id,
        activityType: "status_changed",
        description: `Durum değişti: ${WORK_ORDER_STATUS_LABELS[existing.status as WorkOrderStatus]} → ${WORK_ORDER_STATUS_LABELS[input.status]}`,
        oldValue: { status: existing.status },
        newValue: { status: input.status },
      });
    }

    if (input.assigned_to !== existing.assigned_to) {
      await insertWorkOrderActivity(ctx.supabase, {
        workOrderId: input.id,
        userId: ctx.user.id,
        activityType:
          existing.assigned_to && input.assigned_to
            ? "reassigned"
            : "assigned",
        description: input.assigned_to
          ? "Atanan personel güncellendi"
          : "Atama kaldırıldı",
        oldValue: { assigned_to: existing.assigned_to },
        newValue: { assigned_to: input.assigned_to },
      });

      if (input.assigned_to) {
        await triggerWorkOrderAssignedEmail(ctx.supabase, {
          workOrderId: input.id,
          assignedToUserId: input.assigned_to,
        });
      }
    }

    if (input.priority !== existing.priority) {
      await insertWorkOrderActivity(ctx.supabase, {
        workOrderId: input.id,
        userId: ctx.user.id,
        activityType: "priority_changed",
        description: "Öncelik güncellendi",
        oldValue: { priority: existing.priority },
        newValue: { priority: input.priority },
      });
    }

    await insertWorkOrderActivity(ctx.supabase, {
      workOrderId: input.id,
      userId: ctx.user.id,
      activityType: "edited",
      description: "İş emri bilgileri güncellendi",
    });

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${input.id}`);
    revalidatePath(`/work-orders/${input.id}/edit`);
    revalidatePath(`/customers/${input.customer_id}`);
    if (input.device_id) {
      revalidatePath(`/devices/${input.device_id}`);
    }
    if (input.contract_id) {
      revalidatePath(`/contracts/${input.contract_id}`);
    }

    return { success: true, data: { workOrderId: input.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
