import type { SettingsTab } from "@/lib/constants/settings";
import type {
  BrandFormInput,
  CategoryFormInput,
  CompanyProfileInput,
  DeviceModelFormInput,
} from "@/schemas/settings";
import type { BranchOption, UserListItem } from "@/lib/api/users/types";

export type ActionSuccess<T = void> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export type BrandListItem = {
  id: string;
  name: string;
  default_warranty_years: number;
  display_order: number;
  description: string | null;
  is_active: boolean;
};

export type DeviceModelListItem = {
  id: string;
  brand_id: string;
  brand_name: string;
  model_name: string;
  display_order: number;
  is_active: boolean;
};

export type CategoryListItem = {
  id: string;
  category_type: "contract_type" | "part_category";
  code: string;
  display_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
};

export type BrandOption = {
  id: string;
  name: string;
};

export type SettingsUsersData = {
  users: UserListItem[];
  branches: BranchOption[];
};

export type SettingsPageData =
  | { tab: "users"; data: SettingsUsersData }
  | { tab: "brands"; data: BrandListItem[] }
  | {
      tab: "device-models";
      data: { models: DeviceModelListItem[]; brands: BrandOption[] };
      brandId?: string;
    }
  | { tab: "contract-types"; data: CategoryListItem[] }
  | { tab: "stock-categories"; data: CategoryListItem[] }
  | { tab: "company"; data: CompanyProfileInput };

export type SaveBrandAction = (
  input: BrandFormInput,
) => Promise<ActionResult<{ id: string }>>;

export type DeactivateBrandAction = (
  id: string,
) => Promise<ActionResult>;

export type SaveDeviceModelAction = (
  input: DeviceModelFormInput,
) => Promise<ActionResult<{ id: string }>>;

export type DeactivateDeviceModelAction = (
  id: string,
) => Promise<ActionResult>;

export type SaveCategoryAction = (
  input: CategoryFormInput,
) => Promise<ActionResult<{ id: string }>>;

export type DeactivateCategoryAction = (
  id: string,
) => Promise<ActionResult>;

export type SaveCompanyProfileAction = (
  input: CompanyProfileInput,
) => Promise<ActionResult>;

export type { SettingsTab, BrandFormInput, CategoryFormInput, DeviceModelFormInput, CompanyProfileInput };
