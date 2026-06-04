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
import { COMPANY_SETTINGS_KEY } from "@/lib/constants/settings";
import {
  companyProfileSchema,
  type CompanyProfileInput,
} from "@/schemas/settings";

export async function saveCompanySettings(
  rawInput: CompanyProfileInput,
): Promise<ActionResult> {
  try {
    const input = companyProfileSchema.parse(rawInput);
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const settingValue = {
      name: input.name.trim(),
      address: input.address?.trim() || "",
      phone: input.phone?.trim() || "",
      email: input.email?.trim() || "",
      tax_number: input.tax_number?.trim() || "",
      logo_url: input.logo_url?.trim() || "",
    };

    const { data: existing, error: loadError } = await ctx.supabase
      .from("system_settings")
      .select("id")
      .eq("setting_key", COMPANY_SETTINGS_KEY)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (existing) {
      const { error } = await ctx.supabase
        .from("system_settings")
        .update({
          setting_value: settingValue,
          category: "company",
          updated_by: ctx.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", COMPANY_SETTINGS_KEY);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await ctx.supabase.from("system_settings").insert({
        setting_key: COMPANY_SETTINGS_KEY,
        setting_value: settingValue,
        category: "company",
        description: "Şirket iletişim ve kimlik bilgileri",
        updated_by: ctx.user.id,
      });

      if (error) {
        throw new Error(error.message);
      }
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
