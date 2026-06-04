import type {
  TargetDisplayStatus,
  TargetPeriodType,
  TargetProgressStatus,
  TargetStatus,
} from "@/lib/constants/target";
import type { TargetFilterInput } from "@/schemas/target";

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type TargetFormBranchOption = {
  id: string;
  name: string;
  code: string;
};

export type TargetFormAssigneeOption = {
  id: string;
  full_name: string;
  branch_id: string | null;
};

export type TargetFormOptions = {
  branches: TargetFormBranchOption[];
  assignees: TargetFormAssigneeOption[];
  defaultBranchId: string | null;
};

export type TargetAssignee = {
  user_id: string;
  full_name: string;
};

export type TargetProgress = {
  current_value: number;
  completion_percentage: number;
  days_remaining: number;
  progress_status: TargetProgressStatus;
};

export type TargetFilterOptions = {
  branches: TargetFormBranchOption[];
};

export type TargetListResult = {
  data: TargetListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type TargetListSummary = {
  totalActive: number;
  achievedCount: number;
  inProgressCount: number;
  behindCount: number;
};

export type TargetPreviousPeriodComparison = {
  name: string;
  end_date: string;
  completion_percentage: number;
};

export type TargetListItem = {
  id: string;
  name: string;
  metric_type: string;
  period_type: TargetPeriodType;
  start_date: string;
  end_date: string;
  target_value: number;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  status: TargetStatus;
  current_value: number;
  completion_percentage: number;
  progress_status: TargetProgressStatus | null;
  display_status: TargetDisplayStatus;
  display_status_label: string;
  assignee: TargetAssignee | null;
};

export type { TargetFilterInput };

export type TargetDetail = TargetListItem & {
  description: string | null;
  created_at: string;
  updated_at: string | null;
  created_by_name: string;
  days_remaining: number;
  reward_config: { currency?: string } | null;
  previous_period_comparison: TargetPreviousPeriodComparison | null;
};

export type CreateTargetAction = (
  input: import("@/schemas/target").CreateTargetInput,
) => Promise<ActionResult<{ targetId: string }>>;

export type UpdateTargetAction = (
  input: import("@/schemas/target").UpdateTargetInput,
) => Promise<ActionResult<{ targetId: string }>>;

export type DeleteTargetAction = (
  targetId: string,
) => Promise<ActionResult<{ targetId: string }>>;

export type CancelTargetAction = (
  targetId: string,
) => Promise<ActionResult<{ targetId: string }>>;
