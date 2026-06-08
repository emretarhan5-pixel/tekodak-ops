import type {
  ContractCurrency,
  ContractPaymentMethod,
  ContractRenewalBadge,
  ContractStatus,
  ContractType,
  ContractWorkingHours,
} from "@/lib/constants/contract";

export type CustomerContractListItem = {
  id: string;
  contract_number: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  renewal_badge: ContractRenewalBadge;
  days_remaining: number;
  agreed_price: number;
  currency: ContractCurrency;
};

export type ContractListItem = {
  id: string;
  contract_number: string;
  customer_id: string;
  customer_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  renewal_badge: ContractRenewalBadge;
  days_remaining: number;
  agreed_price: number;
  currency: ContractCurrency;
  responsible_user_id: string;
  responsible_name: string;
};

export type ContractListResult = {
  data: ContractListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ContractFilterBranch = { id: string; name: string; code: string };
export type ContractFilterCustomer = { id: string; name: string };

export type ContractFilterOptions = {
  branches: ContractFilterBranch[];
  customers: ContractFilterCustomer[];
};

export type ContractDeviceItem = {
  id: string;
  device_id: string;
  serial_number: string;
  brand_name: string;
  model_name: string;
};

export type ContractRenewalLink = {
  id: string;
  contract_number: string;
};

export type ContractDetail = {
  id: string;
  contract_number: string;
  customer_id: string;
  customer_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  renewal_badge: ContractRenewalBadge;
  days_remaining: number;
  annual_maintenance_count: number;
  total_maintenance_count: number;
  completed_maintenance_count: number;
  sla_response_hours: number;
  parts_included: boolean;
  travel_included: boolean;
  working_hours: ContractWorkingHours;
  list_price: number | null;
  minimum_price: number | null;
  agreed_price: number;
  currency: ContractCurrency;
  override_reason: string | null;
  payment_method: ContractPaymentMethod;
  vat_included: boolean;
  vat_rate: number;
  responsible_user_id: string;
  responsible_name: string;
  renewed_from: ContractRenewalLink | null;
  renewed_to: ContractRenewalLink | null;
  special_terms: string | null;
  notes: string | null;
  devices: ContractDeviceItem[];
  file_count: number;
  created_at: string;
  updated_at: string;
};

export type ContractFileRow = {
  id: string;
  contract_id: string;
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

export type ContractDeletionImpact = {
  openWorkOrders: number;
};

export type DeleteContractAction = (
  contractId: string,
) => Promise<ActionResult<{ contractId: string }>>;

export type GetContractDeletionImpactAction = (
  contractId: string,
) => Promise<ContractDeletionImpact>;

export type UploadContractFileAction = (
  formData: FormData,
) => Promise<ActionResult<{ fileId: string }>>;

export type DeleteContractFileAction = (
  fileId: string,
) => Promise<ActionResult<{ fileId: string }>>;

export type GetContractFileDownloadUrlAction = (
  fileId: string,
) => Promise<ActionResult<{ url: string }>>;

export type RenewContractAction = (
  input: { contractId: string; start_date: string; end_date: string },
) => Promise<
  ActionResult<{
    contractId: string;
    contractNumber: string;
    priorContractId: string;
  }>
>;

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type CreateContractAction = (
  input: import("@/schemas/contract").CreateContractInput,
) => Promise<ActionResult<{ contractId: string; contractNumber: string }>>;

export type UpdateContractAction = (
  input: import("@/schemas/contract").ContractEditFormValues,
) => Promise<ActionResult<{ contractId: string }>>;
