"use server";

import { z } from "zod";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";
import { revalidateWorkOrderRelatedPaths } from "@/lib/api/work-orders/work-order-revalidate-paths";
import { insertWorkOrderActivity } from "@/lib/api/work-orders/work-order-helpers";
import {
  WORK_ORDER_FILE_BUCKET,
  WORK_ORDER_FILE_CATEGORIES,
  WORK_ORDER_FILE_MAX_BYTES,
  type WorkOrderFileCategory,
} from "@/lib/constants/work-order-file";
import { sanitizeFileName } from "@/lib/utils/sanitize-filename";

const categoryValues = WORK_ORDER_FILE_CATEGORIES.map(
  (c) => c.value,
) as [WorkOrderFileCategory, ...WorkOrderFileCategory[]];

const uploadSchema = z.object({
  workOrderId: z.string().uuid(),
  category: z.enum(categoryValues),
  description: z.string().max(2000).optional().nullable(),
});

export async function uploadWorkOrderFile(
  formData: FormData,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Dosya seçilmedi" };
    }

    if (file.size > WORK_ORDER_FILE_MAX_BYTES) {
      return {
        success: false,
        error: "Dosya boyutu en fazla 10 MB olabilir",
      };
    }

    const parsed = uploadSchema.parse({
      workOrderId: formData.get("workOrderId"),
      category: formData.get("category"),
      description: (formData.get("description") as string) || null,
    });

    const { data: workOrder, error: woError } = await ctx.supabase
      .from("work_orders")
      .select("id, customer_id, device_id, contract_id, branch_id")
      .eq("id", parsed.workOrderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (woError) {
      throw new Error(woError.message);
    }

    if (!workOrder) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, workOrder.branch_id);

    const fileId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${parsed.workOrderId}/${fileId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await ctx.supabase.storage
      .from(WORK_ORDER_FILE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || "Dosya yüklenemedi",
      };
    }

    const description =
      parsed.description?.trim() ? parsed.description.trim() : null;

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("work_order_files")
      .insert({
        id: fileId,
        work_order_id: parsed.workOrderId,
        file_name: safeName,
        storage_path: storagePath,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
        category: parsed.category,
        description,
        uploaded_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      await ctx.supabase.storage
        .from(WORK_ORDER_FILE_BUCKET)
        .remove([storagePath]);
      throw new Error(insertError?.message ?? "Dosya kaydı oluşturulamadı");
    }

    await insertWorkOrderActivity(ctx.supabase, {
      workOrderId: parsed.workOrderId,
      userId: ctx.user.id,
      activityType: "file_uploaded",
      description: `Dosya yüklendi: ${safeName}`,
      newValue: { file_id: fileId, file_name: safeName },
    });

    await revalidateWorkOrderRelatedPaths(workOrder);

    return { success: true, data: { fileId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
