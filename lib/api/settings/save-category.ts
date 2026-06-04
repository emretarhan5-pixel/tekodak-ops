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
  categoryFormSchema,
  validateCategoryCodeForType,
  type CategoryFormInput,
} from "@/schemas/settings";

export async function saveCategory(
  rawInput: CategoryFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = categoryFormSchema.parse(rawInput);
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const codeError = validateCategoryCodeForType(
      input.category_type,
      input.code,
    );
    if (codeError) {
      throw new SettingsApiError(codeError, "FORBIDDEN");
    }

    const payload = {
      category_type: input.category_type,
      code: input.code.trim(),
      display_name: input.display_name.trim(),
      description: input.description?.trim() || null,
      display_order: input.display_order,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data: existing, error: loadError } = await ctx.supabase
        .from("categories")
        .select("id, is_system, code")
        .eq("id", input.id)
        .maybeSingle();

      if (loadError) {
        throw new Error(loadError.message);
      }
      if (!existing) {
        throw new SettingsApiError("Kayıt bulunamadı", "NOT_FOUND");
      }

      const updatePayload = existing.is_system
        ? {
            display_name: payload.display_name,
            description: payload.description,
            display_order: payload.display_order,
            is_active: payload.is_active,
            updated_at: payload.updated_at,
          }
        : payload;

      const { data, error } = await ctx.supabase
        .from("categories")
        .update(updatePayload)
        .eq("id", input.id)
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new SettingsApiError("Bu kod zaten kullanılıyor", "CONFLICT");
        }
        throw new Error(error.message);
      }

      revalidatePath(SETTINGS_REVALIDATE_PATH);
      return { success: true, data: { id: data.id } };
    }

    const { data, error } = await ctx.supabase
      .from("categories")
      .insert({ ...payload, is_system: false })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new SettingsApiError("Bu kod zaten kullanılıyor", "CONFLICT");
      }
      throw new Error(error.message);
    }

    revalidatePath(SETTINGS_REVALIDATE_PATH);
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return { success: false, error: toSettingsError(error) };
  }
}
