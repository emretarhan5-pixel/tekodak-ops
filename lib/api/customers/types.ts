import type {
  CONTRACT_STATUS_FILTERS,
  CustomerFilterInput,
} from "@/schemas/customer";
import type { CustomerType } from "@/lib/constants/customer";

export type CustomerContractBadge =
  (typeof CONTRACT_STATUS_FILTERS)[number];

export type CustomerListItem = {
  id: string;
  name: string;
  tax_number: string;
  customer_type: CustomerType;
  sector: string | null;
  main_phone: string;
  email: string | null;
  city: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  contract_badge: CustomerContractBadge;
  responsible_names: string[];
  is_pinned: boolean;
};

export type CustomerListResult = {
  data: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CustomerContactRow = {
  id: string;
  customer_id: string;
  full_name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
};

export type CustomerResponsibleRow = {
  id: string;
  user_id: string;
  full_name: string;
  is_primary: boolean;
};

export type CustomerFileRow = {
  id: string;
  customer_id: string;
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

export type ExportCustomersFormat = "xlsx" | "csv";

export type ExportCustomersResult = {
  filename: string;
  mimeType: string;
  contentBase64: string;
  recordCount: number;
};

export type UploadCustomerFileAction = (
  formData: FormData,
) => Promise<ActionResult<{ fileId: string }>>;

export type DeleteCustomerFileAction = (
  fileId: string,
) => Promise<ActionResult<{ fileId: string }>>;

export type GetCustomerFileDownloadUrlAction = (
  fileId: string,
) => Promise<ActionResult<{ url: string }>>;

export type ExportCustomersAction = (
  filters: CustomerFilterInput,
  format: ExportCustomersFormat,
) => Promise<ActionResult<ExportCustomersResult>>;

export type DeleteCustomerAction = (
  customerId: string,
) => Promise<ActionResult<{ customerId: string }>>;

export type GetCustomerDeletionImpactAction = (
  customerId: string,
) => Promise<{
  activeContracts: number;
  openWorkOrders: number;
}>;

export type CustomerDetail = {
  id: string;
  name: string;
  tax_office: string | null;
  tax_number: string;
  customer_type: CustomerType;
  sector: string | null;
  main_phone: string;
  email: string | null;
  website: string | null;
  city: string;
  district: string | null;
  full_address: string | null;
  notes: string | null;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  contacts: CustomerContactRow[];
  responsible_users: CustomerResponsibleRow[];
  contract_badge: CustomerContractBadge;
  stats: {
    active_devices: number;
    active_contracts: number;
    open_work_orders: number;
    completed_work_orders: number;
  };
};

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type ToggleCustomerPinAction = (
  customerId: string,
) => Promise<ActionResult<{ is_pinned: boolean }>>;
