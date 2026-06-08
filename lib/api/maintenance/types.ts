import type { MaintenancePlanStatusBadgeVariant } from "@/lib/constants/maintenance";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import type { PlannedDateUrgency } from "@/lib/utils/planned-date-urgency";
import type {
  CompleteMaintenancePlanInput,
  CreateMaintenancePlanInput,
  StartMaintenancePlanInput,
  UpdateMaintenanceDeviceInput,
} from "@/schemas/maintenance";

export type MaintenancePlanListItem = {
  id: string;
  contract_id: string;
  contract_number: string;
  customer_name: string;
  branch_id: string;
  planned_date: string;
  status: MaintenancePlanStatus;
  status_variant: MaintenancePlanStatusBadgeVariant;
  assigned_technician_id: string;
  technician_name: string;
  device_count: number;
  completed_device_count: number;
  days_remaining: number;
  urgency: PlannedDateUrgency;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
};

export type MaintenancePlanDeviceItem = {
  id: string;
  device_id: string;
  serial_number: string;
  brand_name: string;
  model_name: string;
  work_notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
};

export type MaintenancePlanDetail = {
  id: string;
  contract_id: string;
  contract_number: string;
  customer_id: string;
  customer_name: string;
  branch_id: string;
  branch_name: string;
  planned_date: string;
  status: MaintenancePlanStatus;
  status_variant: MaintenancePlanStatusBadgeVariant;
  assigned_technician_id: string;
  technician_name: string;
  notes: string | null;
  completed_at: string | null;
  days_remaining: number;
  urgency: PlannedDateUrgency;
  total_maintenance_count: number;
  completed_maintenance_count: number;
  remaining_maintenance_count: number;
  devices: MaintenancePlanDeviceItem[];
  created_at: string;
  updated_at: string;
};

export type MaintenanceFormTechnicianOption = {
  id: string;
  full_name: string;
};

export type MaintenanceFormDeviceOption = {
  device_id: string;
  serial_number: string;
  brand_name: string;
  model_name: string;
  label: string;
};

export type MaintenanceFormOptions = {
  technicians: MaintenanceFormTechnicianOption[];
  devices: MaintenanceFormDeviceOption[];
  total_maintenance_count: number;
  completed_maintenance_count: number;
  remaining_maintenance_count: number;
};

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type CreateMaintenancePlanAction = (
  input: CreateMaintenancePlanInput,
) => Promise<ActionResult<{ planId: string }>>;

export type StartMaintenancePlanAction = (
  input: StartMaintenancePlanInput,
) => Promise<ActionResult<{ planId: string }>>;

export type UpdateMaintenanceDeviceAction = (
  input: UpdateMaintenanceDeviceInput,
) => Promise<ActionResult<{ deviceRowId: string }>>;

export type CompleteMaintenancePlanAction = (
  input: CompleteMaintenancePlanInput,
) => Promise<ActionResult<{ planId: string; contractId: string }>>;
