import type { TargetDetail } from "@/lib/api/targets/types";
import {
  TARGET_METRIC_TYPES,
  TARGET_PERIOD_TYPES,
  type TargetCurrency,
  type TargetMetricType,
  type TargetPeriodType,
} from "@/lib/constants/target";
import type { TargetFormValues } from "@/schemas/target";

function isFormMetricType(value: string): value is TargetMetricType {
  return (TARGET_METRIC_TYPES as readonly string[]).includes(value);
}

function isFormPeriodType(value: string): value is TargetPeriodType {
  return (TARGET_PERIOD_TYPES as readonly string[]).includes(value);
}

export function targetDetailToFormValues(target: TargetDetail): TargetFormValues {
  const currency =
    target.reward_config?.currency === "EUR"
      ? "EUR"
      : target.reward_config?.currency === "TRY"
        ? "TRY"
        : target.metric_type === "revenue_contracts"
          ? "TRY"
          : undefined;

  return {
    name: target.name,
    description: target.description ?? "",
    metric_type: isFormMetricType(target.metric_type)
      ? target.metric_type
      : "revenue_contracts",
    period_type: isFormPeriodType(target.period_type)
      ? target.period_type
      : "monthly",
    start_date: target.start_date,
    end_date: target.end_date,
    target_value: target.target_value,
    branch_id: target.branch_id,
    assigned_user_id: target.assignee?.user_id ?? "",
    currency: currency as TargetCurrency | undefined,
    status: target.status,
  };
}
