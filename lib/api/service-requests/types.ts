import type { ServiceRequestStatusBadgeVariant } from "@/lib/api/service-requests/service-request-status";
import type { PartUnit } from "@/lib/constants/stock-item";
import type {
  ServiceRequestCustomerDecision,
  ServiceRequestDeliveryMethod,
  ServiceRequestStatus,
  ServiceRequestStep,
  ServiceRequestVatOption,
} from "@/lib/constants/service-request";
import type { AddServiceRequestPartInput } from "@/schemas/service-request";

export type ServiceRequestListItem = {
  id: string;
  request_number: string;
  company_name: string;
  contact_name: string;
  device_type: string;
  brand_model: string;
  serial_number: string;
  status: ServiceRequestStatus;
  status_variant: ServiceRequestStatusBadgeVariant;
  current_step: ServiceRequestStep;
  assigned_technician_id: string;
  technician_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  under_warranty: boolean;
  created_at: string;
};

export type ServiceRequestListResult = {
  data: ServiceRequestListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ServiceRequestQuoteLineItem = {
  id: string;
  description: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  sort_order: number;
};

export type ServiceRequestPartItem = {
  id: string;
  part_id: string;
  part_code: string;
  part_description: string;
  part_unit: PartUnit;
  quantity: number;
  notes: string | null;
  inventory_movement_id: string | null;
  created_at: string;
  created_by_name: string;
};

export type ServiceRequestPartOption = {
  part_id: string;
  part_code: string;
  description: string;
  unit: PartUnit;
  current_quantity: number;
};

export type ServiceRequestPhotoItem = {
  id: string;
  step: ServiceRequestStep;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
  uploaded_by: string;
  uploaded_by_name: string;
};

export type ServiceRequestDetail = {
  id: string;
  request_number: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  status: ServiceRequestStatus;
  status_variant: ServiceRequestStatusBadgeVariant;
  current_step: ServiceRequestStep;
  active_edit_step: ServiceRequestStep | null;
  can_edit: boolean;

  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
  device_type: string;
  brand_model: string;
  device_model_id: string | null;
  serial_number: string;
  device_id: string | null;
  under_warranty: boolean;
  reported_fault: string;
  assigned_technician_id: string;
  technician_name: string;

  diagnosed_fault: string | null;
  customer_statement: string | null;
  technical_inspection_result: string | null;
  wrong_usage_detected: boolean;

  labor_cost: number | null;
  shipping_cost: number | null;
  vat_option: ServiceRequestVatOption | null;
  quote_subtotal: number | null;
  quote_total: number | null;
  quote_sent_to_customer: boolean;
  customer_decision: ServiceRequestCustomerDecision;
  device_returned: boolean;
  quote_lines: ServiceRequestQuoteLineItem[];

  work_description: string | null;
  delivery_method: ServiceRequestDeliveryMethod | null;
  delivered: boolean;
  parts: ServiceRequestPartItem[];

  invoice_issued: boolean;
  invoice_number: string | null;
  payment_received: boolean;
  completed_at: string | null;

  photos: ServiceRequestPhotoItem[];
  created_at: string;
  updated_at: string;
  created_by_name: string;
};

export type ServiceRequestFilterBranch = {
  id: string;
  name: string;
  code: string;
};

export type ServiceRequestFilterTechnician = {
  id: string;
  full_name: string;
};

export type ServiceRequestFilterOptions = {
  branches: ServiceRequestFilterBranch[];
  technicians: ServiceRequestFilterTechnician[];
};

export type ServiceRequestFormDeviceModelOption = {
  id: string;
  label: string;
  brand_name: string;
  model_name: string;
};

export type ServiceRequestFormBranchOption = {
  id: string;
  name: string;
  code: string;
};

export type ServiceRequestFormOptions = {
  branches: ServiceRequestFormBranchOption[];
  device_models: ServiceRequestFormDeviceModelOption[];
};

export type AddServiceRequestPartAction = (
  input: AddServiceRequestPartInput,
) => Promise<ActionResult<{ partRowId: string }>>;

export type RemoveServiceRequestPartAction = (
  partRowId: string,
) => Promise<ActionResult<{ partRowId: string }>>;

export type UploadServiceRequestPhotoAction = (
  formData: FormData,
) => Promise<ActionResult<{ photoId: string }>>;

export type DeleteServiceRequestPhotoAction = (
  photoId: string,
) => Promise<ActionResult<{ photoId: string }>>;

export type GetServiceRequestPhotoUrlAction = (
  photoId: string,
) => Promise<ActionResult<{ url: string }>>;

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
