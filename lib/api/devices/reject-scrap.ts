"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import { notifyUser } from "@/lib/api/devices/scrap-notify";
import type { ActionResult } from "@/lib/api/devices/types";

const rejectScrapSchema = z.object({
  deviceId: z.string().uuid(),
  rejectionReason: z
    .string()
    .trim()
    .min(1, "Red nedeni gereklidir")
    .max(2000),
});

export async function rejectScrap(
  deviceId: string,
  rejectionReason: string,
): Promise<ActionResult<{ deviceId: string }>> {
  try {
    const input = rejectScrapSchema.parse({ deviceId, rejectionReason });
    const ctx = await getDeviceApiContext();

    if (!ctx.permissions.isAdmin) {
      throw new DeviceApiError("Bu işlem yalnızca admin içindir", "FORBIDDEN");
    }

    const { data: device, error: loadError } = await ctx.supabase
      .from("devices")
      .select(
        "id, serial_number, scrap_status, scrapped_by, is_scrapped",
      )
      .eq("id", input.deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!device) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = device as {
      id: string;
      serial_number: string;
      scrap_status: string | null;
      scrapped_by: string | null;
      is_scrapped: boolean;
    };

    if (row.scrap_status !== "pending_approval") {
      return {
        success: false,
        error: "Bu cihaz için bekleyen hek onayı bulunmuyor",
      };
    }

    const { error: updateError } = await ctx.supabase
      .from("devices")
      .update({
        is_scrapped: false,
        scrap_status: "rejected",
        scrap_reason: null,
        scrap_notes: null,
        scrap_next_step: null,
        scrapped_by: null,
        scrapped_at: null,
        scrap_rejection_reason: input.rejectionReason,
        updated_by: ctx.user.id,
      })
      .eq("id", input.deviceId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (row.scrapped_by) {
      await notifyUser(row.scrapped_by, {
        type: "scrap_rejected",
        title: "Hek Reddedildi ✗",
        message: `${row.serial_number} cihazının hek talebi reddedildi. Neden: ${input.rejectionReason}`,
        entityType: "device",
        entityId: input.deviceId,
        actionUrl: `/devices/${input.deviceId}`,
        priority: "normal",
      });
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${input.deviceId}`);

    return { success: true, data: { deviceId: input.deviceId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
