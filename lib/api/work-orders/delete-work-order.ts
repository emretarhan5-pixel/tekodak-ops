"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanDelete,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";

export async function deleteWorkOrder(
  workOrderId: string,
): Promise<ActionResult<{ workOrderId: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();
    assertCanDelete(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("work_orders")
      .select(
        `
        id,
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

    const { error: updateError } = await ctx.supabase
      .from("work_orders")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .eq("id", workOrderId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/customers/${existing.customer_id}`);
    if (existing.device_id) {
      revalidatePath(`/devices/${existing.device_id}`);
    }
    if (existing.contract_id) {
      revalidatePath(`/contracts/${existing.contract_id}`);
    }

    return { success: true, data: { workOrderId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
