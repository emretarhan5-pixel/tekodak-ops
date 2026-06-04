"use server";

import {
  assertCanAccessCustomerBranch,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";
import { DEVICE_FILE_BUCKET } from "@/lib/constants/device-file";

export async function getDeviceFileDownloadUrl(
  fileId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await getDeviceApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("device_files")
      .select(
        `
        id,
        storage_path,
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

    const { data: signed, error: signError } = await ctx.supabase.storage
      .from(DEVICE_FILE_BUCKET)
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
