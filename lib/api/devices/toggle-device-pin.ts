"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessCustomerBranch,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";

export async function toggleDevicePin(
  deviceId: string,
): Promise<ActionResult<{ is_pinned: boolean }>> {
  try {
    const ctx = await getDeviceApiContext();

    const { data: device, error: loadError } = await ctx.supabase
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

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!device) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = device as unknown as {
      id: string;
      customers: { branch_id: string };
    };

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    const { data: existingPin } = await ctx.supabase
      .from("device_pins")
      .select("user_id")
      .eq("device_id", deviceId)
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (existingPin) {
      const { error: deleteError } = await ctx.supabase
        .from("device_pins")
        .delete()
        .eq("device_id", deviceId)
        .eq("user_id", ctx.user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      revalidatePath("/devices");
      revalidatePath(`/devices/${deviceId}`);

      return { success: true, data: { is_pinned: false } };
    }

    const { error: insertError } = await ctx.supabase
      .from("device_pins")
      .insert({
        device_id: deviceId,
        user_id: ctx.user.id,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);

    return { success: true, data: { is_pinned: true } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
