"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanEdit,
  getWorkOrderApiContext,
  toActionError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";
import { triggerWorkOrderAssignedEmail } from "@/lib/email/trigger-work-order-assigned-email";
import {
  computeSlaDeadline,
  emptyToNull,
  insertWorkOrderActivity,
  resolveInitialStatus,
  validateWorkOrderRelations,
} from "@/lib/api/work-orders/work-order-helpers";
import type { TablesInsert } from "@/lib/supabase/types";
import {
  createWorkOrderSchema,
  type CreateWorkOrderInput,
} from "@/schemas/work-order";

export async function createWorkOrder(
  rawInput: CreateWorkOrderInput,
): Promise<
  ActionResult<{ workOrderId: string; workOrderNumber: string }>
> {
  try {
    const input = createWorkOrderSchema.parse(rawInput);
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const { branchId, contractSlaHours } = await validateWorkOrderRelations(
      ctx,
      input,
    );

    const status = resolveInitialStatus(input.assigned_to);
    const now = new Date().toISOString();
    const slaDeadline = computeSlaDeadline(
      input.priority,
      contractSlaHours,
      new Date(),
    );

    const row: TablesInsert<"work_orders"> = {
      work_order_number: "",
      customer_id: input.customer_id,
      device_id: input.device_id,
      contract_id: input.contract_id,
      branch_id: branchId,
      work_type: input.work_type,
      priority: input.priority,
      status,
      problem_description: input.problem_description.trim(),
      assigned_to: input.assigned_to,
      assigned_at: input.assigned_to ? now : null,
      assigned_by: input.assigned_to ? ctx.user.id : null,
      scheduled_date: input.scheduled_date,
      scheduled_time: input.scheduled_time,
      service_location: emptyToNull(input.service_location),
      service_location_note: emptyToNull(input.service_location_note),
      internal_notes: emptyToNull(input.internal_notes),
      is_under_contract: Boolean(input.contract_id),
      sla_deadline: slaDeadline,
      created_by: ctx.user.id,
      updated_by: ctx.user.id,
    };

    const { data: workOrder, error: insertError } = await ctx.supabase
      .from("work_orders")
      .insert(row)
      .select("id, work_order_number")
      .single();

    if (insertError || !workOrder) {
      throw new Error(insertError?.message ?? "İş emri oluşturulamadı");
    }

    await insertWorkOrderActivity(ctx.supabase, {
      workOrderId: workOrder.id,
      userId: ctx.user.id,
      activityType: "created",
      description: `İş emri oluşturuldu (${workOrder.work_order_number})`,
    });

    if (input.assigned_to) {
      await insertWorkOrderActivity(ctx.supabase, {
        workOrderId: workOrder.id,
        userId: ctx.user.id,
        activityType: "assigned",
        description: "Personel atandı",
        newValue: { assigned_to: input.assigned_to },
      });

      await triggerWorkOrderAssignedEmail(ctx.supabase, {
        workOrderId: workOrder.id,
        assignedToUserId: input.assigned_to,
      });
    }

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrder.id}`);
    revalidatePath(`/customers/${input.customer_id}`);
    if (input.device_id) {
      revalidatePath(`/devices/${input.device_id}`);
    }
    if (input.contract_id) {
      revalidatePath(`/contracts/${input.contract_id}`);
    }

    return {
      success: true,
      data: {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.work_order_number,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
