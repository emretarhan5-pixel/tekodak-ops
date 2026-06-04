"use server";

import { getBrands } from "@/lib/api/settings/get-brands";
import { getCategories } from "@/lib/api/settings/get-categories";
import { getCompanySettings } from "@/lib/api/settings/get-company-settings";
import { getDeviceModelsSettings } from "@/lib/api/settings/get-device-models";
import type { SettingsPageData } from "@/lib/api/settings/types";
import { getUsersPageData } from "@/lib/api/users/get-users";
import type { SettingsSearchInput } from "@/schemas/settings";

export async function getSettingsPageData(
  params: SettingsSearchInput,
): Promise<SettingsPageData> {
  switch (params.tab) {
    case "brands":
      return { tab: "brands", data: await getBrands() };
    case "device-models": {
      const { models, brands } = await getDeviceModelsSettings(params.brandId);
      return {
        tab: "device-models",
        data: { models, brands },
        brandId: params.brandId,
      };
    }
    case "contract-types":
      return {
        tab: "contract-types",
        data: await getCategories("contract_type"),
      };
    case "stock-categories":
      return {
        tab: "stock-categories",
        data: await getCategories("part_category"),
      };
    case "company":
      return { tab: "company", data: await getCompanySettings() };
    case "users":
    default:
      return { tab: "users", data: await getUsersPageData() };
  }
}
