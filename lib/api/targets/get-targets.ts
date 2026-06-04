"use server";

import {
  getTargetApiContext,
  resolveBranchFilter,
  TargetApiError,
  toActionError,
} from "@/lib/api/targets/auth";
import { fetchTargetProgressMap } from "@/lib/api/targets/fetch-target-progress";
import { computeTargetDisplayStatus } from "@/lib/api/targets/target-progress-display";
import type { TargetListItem, TargetListResult } from "@/lib/api/targets/types";
import type { TargetPeriodType, TargetStatus } from "@/lib/constants/target";
import { targetFilterSchema, type TargetFilterInput } from "@/schemas/target";

const TARGET_LIST_SELECT = `
  id,
  name,
  metric_type,
  period_type,
  start_date,
  end_date,
  target_value,
  branch_id,
  status,
  final_value,
  created_at,
  branches!targets_branch_id_fkey!inner (
    name,
    code
  ),
  individual_targets (
    user_id,
    users!individual_targets_user_id_fkey (
      full_name
    )
  )
`;

type RawTargetRow = {
  id: string;
  name: string;
  metric_type: string;
  period_type: TargetPeriodType;
  start_date: string;
  end_date: string;
  target_value: number;
  branch_id: string;
  status: TargetStatus;
  final_value: number | null;
  branches: { name: string; code: string };
  individual_targets: Array<{
    user_id: string;
    users: { full_name: string } | null;
  }> | null;
};

function mapRow(
  row: RawTargetRow,
  progress: {
    current_value: number;
    completion_percentage: number;
    progress_status: string | null;
  },
): TargetListItem {
  const assigneeRow = row.individual_targets?.[0];
  const display = computeTargetDisplayStatus(
    row.status,
    row.end_date,
    progress.completion_percentage,
  );

  return {
    id: row.id,
    name: row.name,
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
    progress_status: progress.progress_status as TargetListItem["progress_status"],
    display_status: display.display_status,
    display_status_label: display.display_status_label,
    assignee: assigneeRow
      ? {
          user_id: assigneeRow.user_id,
          full_name: assigneeRow.users?.full_name ?? "—",
        }
      : null,
  };
}

export async function getTargets(
  rawFilters: TargetFilterInput,
): Promise<TargetListResult> {
  try {
    const filters = targetFilterSchema.parse(rawFilters);
    const ctx = await getTargetApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let query = ctx.supabase
      .from("targets")
      .select(TARGET_LIST_SELECT)
      .order("end_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (filters.metricType) {
      query = query.eq("metric_type", filters.metricType);
    }

    if (filters.periodType) {
      query = query.eq("period_type", filters.periodType);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, "\\%");
      query = query.ilike("name", `%${term}%`);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rawRows = (rows ?? []) as unknown as RawTargetRow[];
    const progressMap = await fetchTargetProgressMap(ctx.supabase, rawRows);
    const mapped = rawRows.map((row) =>
      mapRow(
        row,
        progressMap.get(row.id) ?? {
          current_value: 0,
          completion_percentage: 0,
          progress_status: null,
        },
      ),
    );

    const total = mapped.length;
    const from = (filters.page - 1) * filters.pageSize;
    const data = mapped.slice(from, from + filters.pageSize);

    return {
      data,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  } catch (error) {
    if (error instanceof TargetApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
