import type { ReportType } from "@/lib/constants/report";
import type { ReportFilterInput } from "@/schemas/report";
import type { ResolvedReportPeriod } from "@/schemas/report";

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type ReportBranchOption = {
  id: string;
  name: string;
  code: string;
};

export type ReportFilterOptions = {
  branches: ReportBranchOption[];
};

export type ReportExportResult = {
  contentBase64: string;
  filename: string;
  mimeType: string;
  recordCount: number;
};

export type ContractReportSummary = {
  activeCount: number;
  activeAmountTry: number;
  activeAmountEur: number;
  newCount: number;
  newAmountTry: number;
  newAmountEur: number;
  renewedCount: number;
  endedCount: number;
  renewalRate: number | null;
};

export type ContractReportRow = {
  customer_name: string;
  contract_number: string;
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  status_label: string;
};

export type ContractReportData = {
  summary: ContractReportSummary;
  rows: ContractReportRow[];
  period: ResolvedReportPeriod;
};

export type WorkOrderReportSummary = {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  cancelledCount: number;
  averageCompletionHours: number | null;
};

export type TechnicianDistributionRow = {
  assignee_name: string;
  count: number;
};

export type WorkOrderReportRow = {
  work_order_number: string;
  customer_name: string;
  work_type: string;
  work_type_label: string;
  assignee_name: string;
  scheduled_date: string | null;
  duration_hours: number | null;
  status: string;
  status_label: string;
};

export type WorkOrderReportData = {
  summary: WorkOrderReportSummary;
  technicianDistribution: TechnicianDistributionRow[];
  rows: WorkOrderReportRow[];
  period: ResolvedReportPeriod;
};

export type StockReportSummary = {
  totalItems: number;
  criticalCount: number;
  warningCount: number;
  totalInbound: number;
  totalOutbound: number;
};

export type TopUsedPartRow = {
  part_code: string;
  description: string;
  total_quantity: number;
};

export type StockReportRow = {
  part_code: string;
  description: string;
  branch_name: string;
  current_quantity: number;
  min_stock: number;
  stock_status: string;
  stock_status_label: string;
};

export type StockReportData = {
  summary: StockReportSummary;
  topUsedParts: TopUsedPartRow[];
  rows: StockReportRow[];
  period: ResolvedReportPeriod;
};

export type CustomerReportSummary = {
  totalCustomers: number;
  newCustomers: number;
  activeContractCustomers: number;
  totalWorkOrdersInPeriod: number;
};

export type CustomerReportRow = {
  customer_name: string;
  branch_name: string;
  contract_count: number;
  work_order_count: number;
  last_activity: string | null;
};

export type CustomerReportData = {
  summary: CustomerReportSummary;
  rows: CustomerReportRow[];
  period: ResolvedReportPeriod;
};

export type ReportPageData =
  | { type: "contracts"; data: ContractReportData }
  | { type: "work_orders"; data: WorkOrderReportData }
  | { type: "stock"; data: StockReportData }
  | { type: "customers"; data: CustomerReportData };

export type ExportReportAction = (
  filters: ReportFilterInput,
) => Promise<ActionResult<ReportExportResult>>;

export type { ReportFilterInput, ReportType };
