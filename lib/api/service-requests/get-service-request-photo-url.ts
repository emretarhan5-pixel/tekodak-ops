"use server";

import {
  assertCanAccessBranch,
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import type { ActionResult } from "@/lib/api/service-requests/types";
import { SERVICE_REQUEST_PHOTO_BUCKET } from "@/lib/constants/service-request-photo";

export async function getServiceRequestPhotoUrl(
  photoId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await getServiceRequestApiContext();

    const { data: photo, error: loadError } = await ctx.supabase
      .from("service_request_photos")
      .select(
        `
        id,
        storage_path,
        service_requests!inner ( branch_id, deleted_at )
      `,
      )
      .eq("id", photoId)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!photo) {
      throw new ServiceRequestApiError("Fotoğraf bulunamadı", "NOT_FOUND");
    }

    const row = photo as typeof photo & {
      service_requests: { branch_id: string; deleted_at: string | null };
    };

    if (row.service_requests.deleted_at) {
      throw new ServiceRequestApiError("Servis talebi bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, row.service_requests.branch_id);

    const { data: signed, error: signError } = await ctx.supabase.storage
      .from(SERVICE_REQUEST_PHOTO_BUCKET)
      .createSignedUrl(row.storage_path, 300);

    if (signError || !signed?.signedUrl) {
      return {
        success: false,
        error: signError?.message ?? "Görüntü bağlantısı oluşturulamadı",
      };
    }

    return { success: true, data: { url: signed.signedUrl } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
