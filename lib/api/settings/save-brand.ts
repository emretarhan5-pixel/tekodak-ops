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
import { brandFormSchema, type BrandFormInput } from "@/schemas/settings";

export async function saveBrand(
  rawInput: BrandFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = brandFormSchema.parse(rawInput);
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const payload = {
      name: input.name.trim(),
      default_warranty_years: input.default_warranty_years,
      display_order: input.display_order,
      description: input.description?.trim() || null,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data, error } = await ctx.supabase
        .from("brands")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new SettingsApiError("Bu marka adı zaten kayıtlı", "CONFLICT");
        }
        throw new Error(error.message);
      }

      revalidatePath(SETTINGS_REVALIDATE_PATH);
      return { success: true, data: { id: data.id } };
    }

    const { data, error } = await ctx.supabase
      .from("brands")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new SettingsApiError("Bu marka adı zaten kayıtlı", "CONFLICT");
      }
      throw new Error(error.message);
    }

    revalidatePath(SETTINGS_REVALIDATE_PATH);
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return { success: false, error: toSettingsError(error) };
  }
}
