import type { AddWorkOrderPartInput } from "@/schemas/work-order";
import type { WorkOrderStatusAction } from "@/lib/api/work-orders/work-order-status-actions";
import type { PartUnit } from "@/lib/constants/stock-item";
import type {
  WorkOrderActivityType,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@/lib/constants/work-order";
import type { WorkOrderStatusBadgeVariant } from "@/lib/api/work-orders/work-order-status";

export type WorkOrderListItem = {
  id: string;
  work_order_number: string;
  customer_id: string;
  customer_name: string;
  device_id: string | null;
  device_label: string | null;
  work_type: WorkOrderType;
  status: WorkOrderStatus;
  status_variant: WorkOrderStatusBadgeVariant;
  priority: WorkOrderPriority;
  assigned_to: string | null;
  assignee_name: string | null;
  scheduled_date: string | null;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
};

export type WorkOrderListResult = {
  data: WorkOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type WorkOrderActivityItem = {
  id: string;
  activity_type: WorkOrderActivityType;
  description: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  user_id: string;
  user_name: string;
};

export type WorkOrderPartItem = {
  id: string;
  part_id: string;
  part_code: string;
  part_description: string;
  part_unit: PartUnit;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  is_chargeable: boolean;
  notes: string | null;
  inventory_movement_id: string | null;
  added_at: string;
  added_by_name: string;
};

export type WorkOrderPartOption = {
  part_id: string;
  part_code: string;
  description: string;
  unit: PartUnit;
  current_quantity: number;
};

export type WorkOrderPhotoItem = {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  photo_type: string | null;
  caption: string | null;
  taken_at: string;
  uploaded_by: string;
  uploaded_by_name: string;
};

export type WorkOrderFileItem = {
  id: string;
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

export type WorkOrderDetail = {
  id: string;
  work_order_number: string;
  customer_id: string;
  customer_name: string;
  device_id: string | null;
  device_serial: string | null;
  device_brand_name: string | null;
  device_model_name: string | null;
  contract_id: string | null;
  contract_number: string | null;
  work_type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  problem_description: string;
  service_location: string | null;
  service_location_note: string | null;
  internal_notes: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
  assigned_at: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  work_started_at: string | null;
  work_ended_at: string | null;
  actual_duration_hours: number | null;
  total_paused_seconds: number | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  is_under_contract: boolean;
  resolution_status: string | null;
  work_performed: string | null;
  hold_reason: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  activities: WorkOrderActivityItem[];
  parts: WorkOrderPartItem[];
  photos: WorkOrderPhotoItem[];
  files: WorkOrderFileItem[];
};

export type WorkOrderFilterBranch = { id: string; name: string; code: string };
export type WorkOrderFilterCustomer = { id: string; name: string };
export type WorkOrderFilterUser = { id: string; full_name: string };

export type WorkOrderFilterOptions = {
  branches: WorkOrderFilterBranch[];
  customers: WorkOrderFilterCustomer[];
  assignees: WorkOrderFilterUser[];
};

export type WorkOrderDeletionImpact = {
  activityCount: number;
  partCount: number;
  photoCount: number;
  fileCount: number;
};

export type UpdateWorkOrderStatusAction = (
  workOrderId: string,
  action: WorkOrderStatusAction,
  cancellationReason?: string | null,
) => Promise<ActionResult<{ workOrderId: string; status: WorkOrderStatus }>>;

export type DeleteWorkOrderAction = (
  workOrderId: string,
) => Promise<ActionResult<{ workOrderId: string }>>;

export type GetWorkOrderDeletionImpactAction = (
  workOrderId: string,
) => Promise<WorkOrderDeletionImpact>;

export type UploadWorkOrderFileAction = (
  formData: FormData,
) => Promise<ActionResult<{ fileId: string }>>;

export type DeleteWorkOrderFileAction = (
  fileId: string,
) => Promise<ActionResult<{ fileId: string }>>;

export type GetWorkOrderFileDownloadUrlAction = (
  fileId: string,
) => Promise<ActionResult<{ url: string }>>;

export type UploadWorkOrderPhotoAction = (
  formData: FormData,
) => Promise<ActionResult<{ photoId: string }>>;

export type DeleteWorkOrderPhotoAction = (
  photoId: string,
) => Promise<ActionResult<{ photoId: string }>>;

export type GetWorkOrderPhotoUrlAction = (
  photoId: string,
) => Promise<ActionResult<{ url: string }>>;

export type AddWorkOrderNoteAction = (input: {
  workOrderId: string;
  description: string;
}) => Promise<ActionResult<{ activityId: string }>>;

export type GetWorkOrderPartOptionsAction = (
  workOrderId: string,
) => Promise<WorkOrderPartOption[]>;

export type AddWorkOrderPartAction = (
  input: AddWorkOrderPartInput,
) => Promise<ActionResult<{ partRowId: string }>>;

export type RemoveWorkOrderPartAction = (
  partRowId: string,
) => Promise<ActionResult<{ partRowId: string }>>;

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
