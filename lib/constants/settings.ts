export const SETTINGS_TABS = [
  "users",
  "brands",
  "device-models",
  "contract-types",
  "stock-categories",
  "company",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const DEFAULT_SETTINGS_TAB: SettingsTab = "users";

export const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
  users: "Kullanıcılar",
  brands: "Markalar",
  "device-models": "Cihaz Modelleri",
  "contract-types": "Sözleşme Tipleri",
  "stock-categories": "Stok Kategorileri",
  company: "Şirket Bilgileri",
};

export const CATEGORY_TYPES = {
  contract: "contract_type",
  part: "part_category",
} as const;

export const COMPANY_SETTINGS_KEY = "company_profile";
