import type { ServiceRequestStatusBadgeVariant } from "@/lib/api/service-requests/service-request-status";
import type { ContractStatus } from "@/lib/constants/contract";
import type {
  ServiceRequestStatus,
  ServiceRequestStep,
} from "@/lib/constants/service-request";
import type { PartUnit } from "@/lib/constants/stock-item";
import type { MaintenancePlanStatusBadgeVariant } from "@/lib/constants/maintenance";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import type { PlannedDateUrgency } from "@/lib/utils/planned-date-urgency";

export type StaffDashboardPlannedDateUrgency = PlannedDateUrgency;

export type StaffDashboardServiceRequestItem = {
  id: string;
  request_number: string;
  company_name: string;
  device_label: string;
  current_step: ServiceRequestStep;
  step_label: string;
  status: ServiceRequestStatus;
  status_variant: ServiceRequestStatusBadgeVariant;
  planned_date: string;
  days_remaining: number;
  urgency: StaffDashboardPlannedDateUrgency;
};

export type StaffDashboardMaintenancePlanItem = {
  id: string;
  contract_number: string;
  customer_name: string;
  planned_date: string;
  days_remaining: number;
  urgency: StaffDashboardPlannedDateUrgency;
  device_count: number;
  status: MaintenancePlanStatus;
  status_variant: MaintenancePlanStatusBadgeVariant;
};

export type StaffDashboardSummary = {
  completedServiceRequestsThisMonth: number;
  openServiceRequestsCount: number;
  openMaintenancePlansCount: number;
  urgentServiceRequestsCount: number;
  urgentMaintenancePlansCount: number;
};

export type StaffDashboardPerformance = {
  completedThisMonth: number;
  inProgressCount: number;
  openTotalCount: number;
};

export type StaffDashboardActiveTarget = {
  id: string;
  name: string;
  completion_percentage: number;
  days_remaining: number;
};

export type StaffDashboardData = {
  userName: string;
  branchName: string;
  openServiceRequests: StaffDashboardServiceRequestItem[];
  openMaintenancePlans: StaffDashboardMaintenancePlanItem[];
  summary: StaffDashboardSummary;
  performance: StaffDashboardPerformance;
  activeTarget: StaffDashboardActiveTarget | null;
};

export type DashboardSummary = {
  activeCustomers: number;
  activeContracts: number;
  openServiceRequests: number;
  criticalStockCount: number;
};

export type DashboardRenewalContract = {
  id: string;
  contract_number: string;
  customer_name: string;
  end_date: string;
  days_remaining: number;
};

export type DashboardStockAlert = {
  part_id: string;
  branch_id: string;
  part_code: string;
  description: string;
  branch_name: string;
  current_quantity: number;
  min_stock: number;
  stock_status: "critical" | "warning";
  unit: PartUnit;
};

export type DashboardServiceRequestItem = {
  id: string;
  request_number: string;
  company_name: string;
  status: ServiceRequestStatus;
  status_variant: ServiceRequestStatusBadgeVariant;
  created_at: string;
  updated_at: string;
  assignee_name: string | null;
};

export type DashboardContractStatusSummary = {
  active: number;
  renewalNear: number;
  ended: number;
  draft: number;
};

export type DashboardTargetSummaryItem = {
  id: string;
  name: string;
  completion_percentage: number;
  days_remaining: number;
  display_status: import("@/lib/constants/target").TargetDisplayStatus;
};

export type DashboardData = {
  userName: string;
  isAdmin: boolean;
  branchLabel: string | null;
  summary: DashboardSummary;
  renewalContracts: DashboardRenewalContract[];
  stockAlerts: DashboardStockAlert[];
  recentServiceRequests: DashboardServiceRequestItem[];
  contractStatusSummary: DashboardContractStatusSummary;
  todayServiceRequests: DashboardServiceRequestItem[];
  activeTargets: DashboardTargetSummaryItem[];
};

export type RawDashboardContractRow = {
  id: string;
  contract_number: string;
  end_date: string;
  status: ContractStatus;
  customers: { name: string } | null;
};

export type RawDashboardServiceRequestRow = {
  id: string;
  request_number: string;
  company_name: string;
  status: ServiceRequestStatus;
  created_at: string;
  updated_at: string;
  assignee: { full_name: string } | null;
};
