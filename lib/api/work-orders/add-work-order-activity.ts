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
import { addWorkOrderNoteSchema } from "@/schemas/work-order";

export async function addWorkOrderActivity(
  rawInput: { workOrderId: string; description: string },
): Promise<ActionResult<{ activityId: string }>> {
  try {
    const input = addWorkOrderNoteSchema.parse(rawInput);
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const { data: workOrder, error: loadError } = await ctx.supabase
      .from("work_orders")
      .select("id, customer_id, device_id, contract_id, branch_id")
      .eq("id", input.workOrderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!workOrder) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, workOrder.branch_id);

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("work_order_activities")
      .insert({
        work_order_id: input.workOrderId,
        user_id: ctx.user.id,
        activity_type: "note_added",
        description: input.description.trim(),
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Aktivite kaydedilemedi");
    }

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrder.id}`);
    revalidatePath(`/customers/${workOrder.customer_id}`);
    if (workOrder.device_id) {
      revalidatePath(`/devices/${workOrder.device_id}`);
    }
    if (workOrder.contract_id) {
      revalidatePath(`/contracts/${workOrder.contract_id}`);
    }

    return { success: true, data: { activityId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
