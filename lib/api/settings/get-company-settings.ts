"use server";

import {
  getSettingsApiContext,
} from "@/lib/api/settings/auth";
import { SettingsApiError } from "@/lib/api/settings/auth.types";
import {
  assertSettingsAdmin,
  toSettingsError,
} from "@/lib/api/settings/settings-helpers";
import { COMPANY_SETTINGS_KEY } from "@/lib/constants/settings";
import { companyProfileSchema, type CompanyProfileInput } from "@/schemas/settings";

const DEFAULT_COMPANY: CompanyProfileInput = {
  name: "TEKODAK Şirketler Grubu",
  address: "",
  phone: "",
  email: "",
  tax_number: "",
  logo_url: "",
};

function parseCompanyValue(value: unknown): CompanyProfileInput {
  if (!value || typeof value !== "object") {
    return DEFAULT_COMPANY;
  }

  const raw = value as Record<string, unknown>;
  const parsed = companyProfileSchema.safeParse({
    name: typeof raw.name === "string" ? raw.name : DEFAULT_COMPANY.name,
    address: typeof raw.address === "string" ? raw.address : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    email: typeof raw.email === "string" ? raw.email : "",
    tax_number: typeof raw.tax_number === "string" ? raw.tax_number : "",
    logo_url: typeof raw.logo_url === "string" ? raw.logo_url : "",
  });

  return parsed.success ? parsed.data : DEFAULT_COMPANY;
}

export async function getCompanySettings(): Promise<CompanyProfileInput> {
  try {
    const ctx = await getSettingsApiContext();
    assertSettingsAdmin(ctx);

    const { data, error } = await ctx.supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", COMPANY_SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return DEFAULT_COMPANY;
    }

    return parseCompanyValue(data.setting_value);
  } catch (error) {
    if (error instanceof SettingsApiError) {
      throw error;
    }
    throw new Error(toSettingsError(error));
  }
}
