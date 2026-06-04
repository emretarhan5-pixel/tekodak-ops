"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";

export async function deleteWorkOrderFile(
  fileId: string,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("work_order_files")
      .select(
        `
        id,
        work_order_id,
        uploaded_by,
        work_orders!inner (
          customer_id,
          device_id,
          contract_id,
          branch_id,
          deleted_at
        )
      `,
      )
      .eq("id", fileId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!file) {
      throw new WorkOrderApiError("Dosya bulunamadı", "NOT_FOUND");
    }

    const row = file as typeof file & {
      work_orders: {
        customer_id: string;
        device_id: string | null;
        contract_id: string | null;
        branch_id: string;
        deleted_at: string | null;
      };
    };

    if (row.work_orders.deleted_at) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, row.work_orders.branch_id);

    const canDelete =
      ctx.permissions.isAdmin || row.uploaded_by === ctx.user.id;

    if (!canDelete) {
      throw new WorkOrderApiError(
        "Bu dosyayı silme yetkiniz yok",
        "FORBIDDEN",
      );
    }

    const { error: updateError } = await ctx.supabase
      .from("work_order_files")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", fileId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const wo = row.work_orders;
    revalidatePath(`/work-orders/${row.work_order_id}`);
    revalidatePath(`/customers/${wo.customer_id}`);
    if (wo.device_id) {
      revalidatePath(`/devices/${wo.device_id}`);
    }
    if (wo.contract_id) {
      revalidatePath(`/contracts/${wo.contract_id}`);
    }

    return { success: true, data: { fileId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
