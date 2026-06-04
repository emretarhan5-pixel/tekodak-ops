"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessCustomerBranch,
  assertCanDelete,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";

export async function deleteDevice(
  deviceId: string,
): Promise<ActionResult<{ deviceId: string }>> {
  try {
    const ctx = await getDeviceApiContext();
    assertCanDelete(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        customer_id,
        customers!devices_customer_id_fkey!inner ( branch_id )
      `,
      )
      .eq("id", deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = existing as unknown as {
      id: string;
      customer_id: string;
      customers: { branch_id: string };
    };

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    const { error: updateError } = await ctx.supabase
      .from("devices")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .eq("id", deviceId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath(`/customers/${row.customer_id}`);

    return { success: true, data: { deviceId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
