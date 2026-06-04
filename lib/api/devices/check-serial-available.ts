"use server";

import {
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";

export async function checkDeviceSerialAvailable(
  serialNumber: string,
  excludeDeviceId?: string,
): Promise<{ available: boolean; message?: string }> {
  try {
    const normalized = serialNumber.trim();
    if (!normalized) {
      return { available: true };
    }

    const ctx = await getDeviceApiContext();

    let query = ctx.supabase
      .from("devices")
      .select("id")
      .eq("serial_number", normalized)
      .is("deleted_at", null);

    if (excludeDeviceId) {
      query = query.neq("id", excludeDeviceId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return {
        available: false,
        message: "Bu seri numarası ile kayıtlı bir cihaz zaten var",
      };
    }

    return { available: true };
  } catch (error) {
    if (error instanceof DeviceApiError) {
      return { available: false, message: error.message };
    }
    return { available: false, message: toActionError(error) };
  }
}
