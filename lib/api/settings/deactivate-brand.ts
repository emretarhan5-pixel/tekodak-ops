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

export async function deactivateBrand(id: string): Promise<ActionResult> {
  try {
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const { error } = await ctx.supabase
      .from("brands")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(SETTINGS_REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof SettingsApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toSettingsError(error) };
  }
}
