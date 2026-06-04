"use server";

import {
  getTargetApiContext,
  resolveBranchFilter,
  TargetApiError,
  toActionError,
} from "@/lib/api/targets/auth";
import { fetchTargetProgressMap } from "@/lib/api/targets/fetch-target-progress";
import { computeTargetDisplayStatus } from "@/lib/api/targets/target-progress-display";
import type { TargetListSummary } from "@/lib/api/targets/types";
import type { TargetStatus } from "@/lib/constants/target";

type SummaryTargetRow = {
  id: string;
  status: TargetStatus;
  end_date: string;
  target_value: number;
  final_value: number | null;
};

export async function getTargetListSummary(
  branchId?: string,
): Promise<TargetListSummary> {
  try {
    const ctx = await getTargetApiContext();
    const resolvedBranchId = resolveBranchFilter(ctx, branchId);

    let query = ctx.supabase
      .from("targets")
      .select("id, status, end_date, target_value, final_value")
      .eq("status", "active");

    if (resolvedBranchId) {
      query = query.eq("branch_id", resolvedBranchId);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rawRows = (rows ?? []) as SummaryTargetRow[];

    if (rawRows.length === 0) {
      return {
        totalActive: 0,
        achievedCount: 0,
        inProgressCount: 0,
        behindCount: 0,
      };
    }

    const progressMap = await fetchTargetProgressMap(ctx.supabase, rawRows);

    let achievedCount = 0;
    let inProgressCount = 0;
    let behindCount = 0;

    for (const row of rawRows) {
      const progress = progressMap.get(row.id) ?? {
        completion_percentage: 0,
      };
      const display = computeTargetDisplayStatus(
        row.status,
        row.end_date,
        progress.completion_percentage,
      );

      switch (display.display_status) {
        case "achieved":
          achievedCount += 1;
          break;
        case "in_progress":
          inProgressCount += 1;
          break;
        case "behind":
          behindCount += 1;
          break;
        default:
          break;
      }
    }

    return {
      totalActive: rawRows.length,
      achievedCount,
      inProgressCount,
      behindCount,
    };
  } catch (error) {
    if (error instanceof TargetApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
