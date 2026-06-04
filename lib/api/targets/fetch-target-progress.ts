import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { TargetProgressStatus, TargetStatus } from "@/lib/constants/target";
import {
  computeCompletionPercentage,
  deriveProgressStatus,
} from "@/lib/api/targets/target-progress-display";

export type TargetProgressSnapshot = {
  current_value: number;
  completion_percentage: number;
  progress_status: TargetProgressStatus | null;
  days_remaining: number;
};

type TargetProgressRowInput = {
  id: string;
  status: TargetStatus;
  end_date: string;
  target_value: number;
  final_value: number | null;
};

export function computeTargetDaysRemaining(endDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.ceil(
    (new Date(endDate).getTime() - new Date(today).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

async function resolveCurrentValue(
  supabase: AppSupabaseClient,
  row: TargetProgressRowInput,
): Promise<number> {
  if (row.status === "completed" && row.final_value != null) {
    return Number(row.final_value);
  }

  const { data, error } = await supabase.rpc("calculate_target_current_value", {
    target_uuid: row.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Number(data ?? 0);
}

export async function fetchTargetProgressForRow(
  supabase: AppSupabaseClient,
  row: TargetProgressRowInput,
): Promise<TargetProgressSnapshot> {
  const days_remaining = computeTargetDaysRemaining(row.end_date);
  const currentValue = await resolveCurrentValue(supabase, row);
  const completion_percentage = computeCompletionPercentage(
    currentValue,
    row.target_value,
  );

  return {
    current_value: currentValue,
    completion_percentage,
    progress_status: deriveProgressStatus(
      row.end_date,
      row.target_value,
      currentValue,
    ),
    days_remaining,
  };
}

export type TargetProgressValues = {
  current_value: number;
  completion_percentage: number;
  progress_status: TargetProgressStatus | null;
};

export async function fetchTargetProgressMap(
  supabase: AppSupabaseClient,
  rows: TargetProgressRowInput[],
): Promise<Map<string, TargetProgressValues>> {
  const map = new Map<string, TargetProgressValues>();

  if (rows.length === 0) {
    return map;
  }

  await Promise.all(
    rows.map(async (row) => {
      const snapshot = await fetchTargetProgressForRow(supabase, row);
      map.set(row.id, {
        current_value: snapshot.current_value,
        completion_percentage: snapshot.completion_percentage,
        progress_status: snapshot.progress_status,
      });
    }),
  );

  return map;
}
