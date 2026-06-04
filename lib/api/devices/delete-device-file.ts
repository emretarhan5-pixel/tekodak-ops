"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessCustomerBranch,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";

export async function deleteDeviceFile(
  fileId: string,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getDeviceApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("device_files")
      .select(
        `
        id,
        device_id,
        uploaded_by,
        devices!inner (
          deleted_at,
          customers!devices_customer_id_fkey!inner ( branch_id, deleted_at )
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
      throw new DeviceApiError("Dosya bulunamadı", "NOT_FOUND");
    }

    const row = file as typeof file & {
      devices: {
        deleted_at: string | null;
        customers: { branch_id: string; deleted_at: string | null };
      };
    };

    if (row.devices.deleted_at || row.devices.customers.deleted_at) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    assertCanAccessCustomerBranch(ctx, row.devices.customers.branch_id);

    const canDelete =
      ctx.permissions.isAdmin || row.uploaded_by === ctx.user.id;

    if (!canDelete) {
      throw new DeviceApiError(
        "Bu dosyayı silme yetkiniz yok",
        "FORBIDDEN",
      );
    }

    const { error: updateError } = await ctx.supabase
      .from("device_files")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
      })
      .eq("id", fileId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/devices/${row.device_id}`);

    return { success: true, data: { fileId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
