"use server";

import {
  assertCanAccessCustomerBranch,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { DeviceFileRow } from "@/lib/api/devices/types";

export async function getDeviceFiles(deviceId: string): Promise<DeviceFileRow[]> {
  try {
    const ctx = await getDeviceApiContext();

    const { data: device, error: deviceError } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        customers!devices_customer_id_fkey!inner ( branch_id )
      `,
      )
      .eq("id", deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    if (!device) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = device as unknown as {
      id: string;
      customers: { branch_id: string };
    };

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    const { data, error } = await ctx.supabase
      .from("device_files")
      .select(
        `
        id,
        device_id,
        file_name,
        storage_path,
        file_size_bytes,
        mime_type,
        category,
        description,
        uploaded_at,
        uploaded_by,
        uploader:users!device_files_uploaded_by_fkey (
          full_name
        )
      `,
      )
      .eq("device_id", deviceId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((fileRow) => {
      const typed = fileRow as typeof fileRow & {
        uploader: { full_name: string } | null;
      };
      return {
        id: typed.id,
        device_id: typed.device_id,
        file_name: typed.file_name,
        storage_path: typed.storage_path,
        file_size_bytes: typed.file_size_bytes,
        mime_type: typed.mime_type,
        category: typed.category,
        description: typed.description,
        uploaded_at: typed.uploaded_at ?? new Date().toISOString(),
        uploaded_by: typed.uploaded_by,
        uploaded_by_name: typed.uploader?.full_name ?? "—",
      };
    });
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
