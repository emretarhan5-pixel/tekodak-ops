"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ActionResult } from "@/lib/api/work-orders/types";
import { insertWorkOrderActivity } from "@/lib/api/work-orders/work-order-helpers";
import {
  WORK_ORDER_FILE_BUCKET,
  WORK_ORDER_PHOTO_MAX_BYTES,
  WORK_ORDER_PHOTO_TYPES,
  type WorkOrderPhotoType,
} from "@/lib/constants/work-order-file";
import { sanitizeFileName } from "@/lib/utils/sanitize-filename";

const photoTypeValues = WORK_ORDER_PHOTO_TYPES.map(
  (t) => t.value,
) as [WorkOrderPhotoType, ...WorkOrderPhotoType[]];

const uploadSchema = z.object({
  workOrderId: z.string().uuid(),
  photoType: z.enum(photoTypeValues),
  caption: z.string().max(500).optional().nullable(),
});

const IMAGE_MIME_PREFIX = "image/";

export async function uploadWorkOrderPhoto(
  formData: FormData,
): Promise<ActionResult<{ photoId: string }>> {
  try {
    const ctx = await getWorkOrderApiContext();
    assertCanEdit(ctx);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Fotoğraf seçilmedi" };
    }

    if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
      return { success: false, error: "Yalnızca görsel dosyaları yüklenebilir" };
    }

    if (file.size > WORK_ORDER_PHOTO_MAX_BYTES) {
      return {
        success: false,
        error: "Fotoğraf boyutu en fazla 10 MB olabilir",
      };
    }

    const parsed = uploadSchema.parse({
      workOrderId: formData.get("workOrderId"),
      photoType: formData.get("photoType"),
      caption: (formData.get("caption") as string) || null,
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

    const photoId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${parsed.workOrderId}/photos/${photoId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await ctx.supabase.storage
      .from(WORK_ORDER_FILE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || "Fotoğraf yüklenemedi",
      };
    }

    const caption = parsed.caption?.trim() ? parsed.caption.trim() : null;

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("work_order_photos")
      .insert({
        id: photoId,
        work_order_id: parsed.workOrderId,
        storage_path: storagePath,
        file_size_bytes: file.size,
        photo_type: parsed.photoType,
        caption,
        uploaded_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      await ctx.supabase.storage
        .from(WORK_ORDER_FILE_BUCKET)
        .remove([storagePath]);
      throw new Error(insertError?.message ?? "Fotoğraf kaydı oluşturulamadı");
    }

    await insertWorkOrderActivity(ctx.supabase, {
      workOrderId: parsed.workOrderId,
      userId: ctx.user.id,
      activityType: "file_uploaded",
      description: `Fotoğraf yüklendi: ${safeName}`,
      newValue: { photo_id: photoId, photo_type: parsed.photoType },
    });

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrder.id}`);
    revalidatePath(`/customers/${workOrder.customer_id}`);
    if (workOrder.device_id) {
      revalidatePath(`/devices/${workOrder.device_id}`);
    }
    if (workOrder.contract_id) {
      revalidatePath(`/contracts/${workOrder.contract_id}`);
    }

    return { success: true, data: { photoId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
