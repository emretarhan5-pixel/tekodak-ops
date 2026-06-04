import type { ContractStatus } from "@/lib/constants/contract";
import type { PartUnit } from "@/lib/constants/stock-item";
import type { WorkOrderStatus } from "@/lib/constants/work-order";

export type DashboardSummary = {
  activeCustomers: number;
  activeContracts: number;
  openWorkOrders: number;
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

export type DashboardWorkOrderItem = {
  id: string;
  work_order_number: string;
  customer_name: string;
  status: WorkOrderStatus;
  scheduled_date: string | null;
  created_at: string;
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
  recentWorkOrders: DashboardWorkOrderItem[];
  contractStatusSummary: DashboardContractStatusSummary;
  todayWorkOrders: DashboardWorkOrderItem[];
  activeTargets: DashboardTargetSummaryItem[];
};

export type RawDashboardContractRow = {
  id: string;
  contract_number: string;
  end_date: string;
  status: ContractStatus;
  customers: { name: string } | null;
};

export type RawDashboardWorkOrderRow = {
  id: string;
  work_order_number: string;
  status: WorkOrderStatus;
  scheduled_date: string | null;
  created_at: string;
  customers: { name: string } | null;
  assignee: { full_name: string } | null;
};
