"use server";

import {
  assertCanAccessBranch,
  getTargetApiContext,
  TargetApiError,
  toActionError,
} from "@/lib/api/targets/auth";
import { fetchTargetProgressForRow } from "@/lib/api/targets/fetch-target-progress";
import { computeTargetDisplayStatus } from "@/lib/api/targets/target-progress-display";
import type { TargetDetail } from "@/lib/api/targets/types";
import type {
  TargetDisplayStatus,
  TargetPeriodType,
  TargetProgressStatus,
  TargetStatus,
} from "@/lib/constants/target";

const TARGET_DETAIL_SELECT = `
  id,
  name,
  description,
  metric_type,
  period_type,
  start_date,
  end_date,
  target_value,
  branch_id,
  status,
  final_value,
  reward_config,
  created_at,
  updated_at,
  created_by,
  branches!targets_branch_id_fkey!inner (
    name,
    code
  ),
  created_by_user:users!targets_created_by_fkey (
    full_name
  ),
  individual_targets (
    user_id,
    users!individual_targets_user_id_fkey (
      full_name
    )
  )
`;

type RawTargetDetailRow = {
  id: string;
  name: string;
  description: string | null;
  metric_type: string;
  period_type: TargetPeriodType;
  start_date: string;
  end_date: string;
  target_value: number;
  branch_id: string;
  status: TargetStatus;
  final_value: number | null;
  reward_config: { currency?: string } | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  branches: { name: string; code: string };
  created_by_user: { full_name: string } | null;
  individual_targets: Array<{
    user_id: string;
    users: { full_name: string } | null;
  }> | null;
};

export async function getTargetById(targetId: string): Promise<TargetDetail> {
  try {
    const ctx = await getTargetApiContext();

    const { data, error } = await ctx.supabase
      .from("targets")
      .select(TARGET_DETAIL_SELECT)
      .eq("id", targetId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new TargetApiError("Hedef bulunamadı", "NOT_FOUND");
    }

    const row = data as unknown as RawTargetDetailRow;

    if (!row.branch_id) {
      throw new TargetApiError("Hedef şubesi tanımlı değil", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, row.branch_id);

    const progress = await fetchTargetProgressForRow(ctx.supabase, {
      id: row.id,
      status: row.status,
      end_date: row.end_date,
      target_value: row.target_value,
      final_value: row.final_value,
    });

    const display = computeTargetDisplayStatus(
      row.status,
      row.end_date,
      progress.completion_percentage,
    );

    const assigneeRow = row.individual_targets?.[0];

    let previous_period_comparison: TargetDetail["previous_period_comparison"] =
      null;

    const { data: previousRow } = await ctx.supabase
      .from("targets")
      .select("id, name, end_date, status, target_value, final_value")
      .eq("branch_id", row.branch_id)
      .eq("metric_type", row.metric_type)
      .eq("period_type", row.period_type)
      .lt("end_date", row.start_date)
      .neq("id", row.id)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousRow) {
      const prevProgress = await fetchTargetProgressForRow(ctx.supabase, {
        id: previousRow.id,
        status: previousRow.status as TargetStatus,
        end_date: previousRow.end_date,
        target_value: Number(previousRow.target_value),
        final_value: previousRow.final_value,
      });

      previous_period_comparison = {
        name: previousRow.name,
        end_date: previousRow.end_date,
        completion_percentage: prevProgress.completion_percentage,
      };
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      metric_type: row.metric_type,
      period_type: row.period_type,
      start_date: row.start_date,
      end_date: row.end_date,
      target_value: row.target_value,
      branch_id: row.branch_id,
      branch_name: row.branches.name,
      branch_code: row.branches.code,
      status: row.status,
      current_value: progress.current_value,
      completion_percentage: progress.completion_percentage,
      progress_status: progress.progress_status,
      display_status: display.display_status,
      display_status_label: display.display_status_label,
      days_remaining: progress.days_remaining,
      assignee: assigneeRow
        ? {
            user_id: assigneeRow.user_id,
            full_name: assigneeRow.users?.full_name ?? "—",
          }
        : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by_name: row.created_by_user?.full_name ?? "—",
      reward_config: row.reward_config,
      previous_period_comparison,
    };
  } catch (error) {
    if (error instanceof TargetApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
