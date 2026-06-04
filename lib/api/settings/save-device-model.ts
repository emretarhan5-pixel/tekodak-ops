"use server";

import { revalidatePath } from "next/cache";

import {
  getSettingsApiContext,
} from "@/lib/api/settings/auth";
import { SettingsApiError } from "@/lib/api/settings/auth.types";
import {
  assertSettingsAdmin,
  SETTINGS_REVALIDATE_PATH,
  toSettingsError,
} from "@/lib/api/settings/settings-helpers";
import type { ActionResult } from "@/lib/api/settings/types";
import {
  deviceModelFormSchema,
  type DeviceModelFormInput,
} from "@/schemas/settings";

export async function saveDeviceModel(
  rawInput: DeviceModelFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = deviceModelFormSchema.parse(rawInput);
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const payload = {
      brand_id: input.brand_id,
      model_name: input.model_name.trim(),
      display_order: input.display_order,
      is_active: input.is_active,
    };

    if (input.id) {
      const { data, error } = await ctx.supabase
        .from("device_models")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new SettingsApiError(
            "Bu marka için aynı model adı zaten var",
            "CONFLICT",
          );
        }
        throw new Error(error.message);
      }

      revalidatePath(SETTINGS_REVALIDATE_PATH);
      return { success: true, data: { id: data.id } };
    }

    const { data, error } = await ctx.supabase
      .from("device_models")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new SettingsApiError(
          "Bu marka için aynı model adı zaten var",
          "CONFLICT",
        );
      }
      throw new Error(error.message);
    }

    revalidatePath(SETTINGS_REVALIDATE_PATH);
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return { success: false, error: toSettingsError(error) };
  }
}
