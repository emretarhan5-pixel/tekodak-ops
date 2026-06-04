import type { ContractRenewalBadge, ContractStatus } from "@/lib/constants/contract";
import type { DeviceStatus } from "@/lib/constants/device";

export type WarrantyBadge = "active" | "warning_90" | "critical_30" | "expired";

export type DeviceListItem = {
  id: string;
  serial_number: string;
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
  customer_id: string;
  customer_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  status: DeviceStatus;
  warranty_badge: WarrantyBadge;
  warranty_end_date: string | null;
  installation_date: string | null;
  is_pinned: boolean;
};

export type DeviceListResult = {
  data: DeviceListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type DeviceDetail = {
  id: string;
  serial_number: string;
  manufacturing_year: number | null;
  installation_date: string | null;
  warranty_end_date: string | null;
  location_address: string | null;
  status: DeviceStatus;
  notes: string | null;
  customer_id: string;
  customer_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  brand_id: string;
  brand_name: string;
  default_warranty_years: number | null;
  model_id: string;
  model_name: string;
  model_code: string | null;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
};

export type BrandOption = {
  id: string;
  name: string;
  default_warranty_years: number | null;
};

export type DeviceModelOption = {
  id: string;
  brand_id: string;
  name: string;
};

export type DeviceFilterBranch = { id: string; name: string; code: string };
export type DeviceFilterCustomer = { id: string; name: string };
export type DeviceFilterBrand = { id: string; name: string };

export type DeviceFilterOptions = {
  branches: DeviceFilterBranch[];
  brands: DeviceFilterBrand[];
  customers: DeviceFilterCustomer[];
};

export type DeviceFileRow = {
  id: string;
  device_id: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  category: string | null;
  description: string | null;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_by_name: string;
};

export type ToggleDevicePinAction = (
  deviceId: string,
) => Promise<ActionResult<{ is_pinned: boolean }>>;

export type DeviceContractLink = {
  link_id: string;
  contract_id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  renewal_badge: ContractRenewalBadge;
  days_remaining: number;
};

export type CustomerDeviceItem = {
  id: string;
  serial_number: string;
  brand_name: string;
  model_name: string;
  status: DeviceStatus;
  warranty_badge: WarrantyBadge;
};

export type UploadDeviceFileAction = (
  formData: FormData,
) => Promise<ActionResult<{ fileId: string }>>;

export type DeleteDeviceFileAction = (
  fileId: string,
) => Promise<ActionResult<{ fileId: string }>>;

export type GetDeviceFileDownloadUrlAction = (
  fileId: string,
) => Promise<ActionResult<{ url: string }>>;

export type DeviceDeletionImpact = {
  openWorkOrders: number;
};

export type GetDeviceDeletionImpactAction = (
  deviceId: string,
) => Promise<DeviceDeletionImpact>;

export type DeleteDeviceAction = (
  deviceId: string,
) => Promise<ActionResult<{ deviceId: string }>>;

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
