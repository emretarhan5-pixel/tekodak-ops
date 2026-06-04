import { settingsSearchSchema } from "@/schemas/settings";

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseSettingsSearchParams(
  params: Record<string, SearchParamValue>,
) {
  return settingsSearchSchema.parse({
    tab: first(params.tab),
    brandId: first(params.brandId),
  });
}
