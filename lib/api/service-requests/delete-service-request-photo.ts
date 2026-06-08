"use server";

import {
  assertCanEditServiceRequest,
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import type { ActionResult } from "@/lib/api/service-requests/types";
import { SERVICE_REQUEST_PHOTO_BUCKET } from "@/lib/constants/service-request-photo";

export async function deleteServiceRequestPhoto(
  photoId: string,
): Promise<ActionResult<{ photoId: string }>> {
  try {
    const ctx = await getServiceRequestApiContext();

    const { data: photo, error: loadError } = await ctx.supabase
      .from("service_request_photos")
      .select(
        `
        id,
        storage_path,
        service_request_id,
        uploaded_by,
        service_requests!inner (
          branch_id,
          assigned_technician_id,
          status,
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
      throw new ServiceRequestApiError("Fotoğraf bulunamadı", "NOT_FOUND");
    }

    const row = photo as typeof photo & {
      service_requests: {
        branch_id: string;
        assigned_technician_id: string;
        status: string;
        deleted_at: string | null;
      };
    };

    if (row.service_requests.deleted_at) {
      throw new ServiceRequestApiError("Servis talebi bulunamadı", "NOT_FOUND");
    }

    const canDelete =
      ctx.permissions.isAdmin ||
      (row.uploaded_by === ctx.user.id &&
        (ctx.permissions.isAdmin ||
          row.service_requests.assigned_technician_id === ctx.user.id));

    try {
      assertCanEditServiceRequest(ctx, row.service_requests);
    } catch {
      if (!ctx.permissions.isAdmin) {
        throw new ServiceRequestApiError(
          "Bu fotoğrafı silme yetkiniz yok",
          "FORBIDDEN",
        );
      }
    }

    if (!canDelete && !ctx.permissions.isAdmin) {
      throw new ServiceRequestApiError(
        "Bu fotoğrafı silme yetkiniz yok",
        "FORBIDDEN",
      );
    }

    const { error: deleteError } = await ctx.supabase
      .from("service_request_photos")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await ctx.supabase.storage
      .from(SERVICE_REQUEST_PHOTO_BUCKET)
      .remove([row.storage_path]);

    revalidateServiceRequestPaths(row.service_request_id);

    return { success: true, data: { photoId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
