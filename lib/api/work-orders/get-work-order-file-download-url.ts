"use server";

import {
  assertCanAccessBranch,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";
import { WORK_ORDER_FILE_BUCKET } from "@/lib/constants/work-order-file";

export async function getWorkOrderFileDownloadUrl(
  fileId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("work_order_files")
      .select(
        `
        id,
        storage_path,
        work_orders!inner ( branch_id, deleted_at )
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
      work_orders: { branch_id: string; deleted_at: string | null };
    };

    if (row.work_orders.deleted_at) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, row.work_orders.branch_id);

    const { data: signed, error: signError } = await ctx.supabase.storage
      .from(WORK_ORDER_FILE_BUCKET)
      .createSignedUrl(row.storage_path, 120);

    if (signError || !signed?.signedUrl) {
      return {
        success: false,
        error: signError?.message ?? "İndirme bağlantısı oluşturulamadı",
      };
    }

    return { success: true, data: { url: signed.signedUrl } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
