"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";
import { WORK_ORDER_FILE_BUCKET } from "@/lib/constants/work-order-file";

export async function deleteWorkOrderPhoto(
  photoId: string,
): Promise<ActionResult<{ photoId: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();

    const { data: photo, error: loadError } = await ctx.supabase
      .from("work_order_photos")
      .select(
        `
        id,
        storage_path,
        thumbnail_path,
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
      .eq("id", photoId)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!photo) {
      throw new WorkOrderApiError("Fotoğraf bulunamadı", "NOT_FOUND");
    }

    const row = photo as typeof photo & {
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
        "Bu fotoğrafı silme yetkiniz yok",
        "FORBIDDEN",
      );
    }

    const pathsToRemove = [row.storage_path];
    if (row.thumbnail_path) {
      pathsToRemove.push(row.thumbnail_path);
    }

    const { error: deleteError } = await ctx.supabase
      .from("work_order_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await ctx.supabase.storage.from(WORK_ORDER_FILE_BUCKET).remove(pathsToRemove);

    const wo = row.work_orders;
    revalidatePath(`/work-orders/${row.work_order_id}`);
    revalidatePath(`/customers/${wo.customer_id}`);
    if (wo.device_id) {
      revalidatePath(`/devices/${wo.device_id}`);
    }
    if (wo.contract_id) {
      revalidatePath(`/contracts/${wo.contract_id}`);
    }

    return { success: true, data: { photoId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
