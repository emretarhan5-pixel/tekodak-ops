"use server";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
} from "@/lib/api/service-requests/auth";
import {
  assertStatus,
  loadServiceRequestForEdit,
} from "@/lib/api/service-requests/service-request-helpers";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import type { ActionResult } from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_PHOTO_BUCKET,
  SERVICE_REQUEST_PHOTO_MAX_BYTES,
} from "@/lib/constants/service-request-photo";
import { uploadServiceRequestPhotoSchema } from "@/schemas/service-request";
import { sanitizeFileName } from "@/lib/utils/sanitize-filename";

const IMAGE_MIME_PREFIX = "image/";

export async function uploadServiceRequestPhoto(
  formData: FormData,
): Promise<ActionResult<{ photoId: string }>> {
  try {
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Fotoğraf seçilmedi" };
    }

    if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
      return { success: false, error: "Yalnızca görsel dosyaları yüklenebilir" };
    }

    if (file.size > SERVICE_REQUEST_PHOTO_MAX_BYTES) {
      return {
        success: false,
        error: "Fotoğraf boyutu en fazla 10 MB olabilir",
      };
    }

    const parsed = uploadServiceRequestPhotoSchema.parse({
      serviceRequestId: formData.get("serviceRequestId"),
      step: formData.get("step"),
    });

    const row = await loadServiceRequestForEdit(ctx, parsed.serviceRequestId);

    if (parsed.step === 2) {
      assertStatus(row, ["ariza_tespit"]);
    } else {
      assertStatus(row, ["teklif_onaylandi"]);
    }

    const photoId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${parsed.serviceRequestId}/${parsed.step}/${photoId}/${safeName}`;

    const { error: uploadError } = await ctx.supabase.storage
      .from(SERVICE_REQUEST_PHOTO_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("service_request_photos")
      .insert({
        id: photoId,
        service_request_id: parsed.serviceRequestId,
        step: parsed.step,
        storage_path: storagePath,
        file_name: safeName,
        mime_type: file.type,
        file_size_bytes: file.size,
        uploaded_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      await ctx.supabase.storage
        .from(SERVICE_REQUEST_PHOTO_BUCKET)
        .remove([storagePath]);
      throw new Error(insertError?.message ?? "Fotoğraf kaydı oluşturulamadı");
    }

    revalidateServiceRequestPaths(parsed.serviceRequestId);

    return { success: true, data: { photoId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
