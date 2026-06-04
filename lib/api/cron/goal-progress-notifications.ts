import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import {
  hasNotificationToday,
  insertNotification,
} from "@/lib/api/cron/notification-insert";
import type { CronJobResult } from "@/lib/api/cron/types";
import { TARGET_METRIC_TYPE_LABELS } from "@/lib/constants/target";
import type { TargetMetricType } from "@/lib/constants/target";
import { createAdminClient } from "@/lib/supabase/admin";

const COMPLETION_THRESHOLD = 50;
const DAYS_REMAINING_THRESHOLD = 14;

export async function runGoalProgressNotifications(): Promise<CronJobResult> {
  const admin = createAdminClient();

  const result: CronJobResult = {
    job: "goal-progress",
    processed: 0,
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [],
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: targets, error } = await admin
    .from("target_progress")
    .select(
      "target_id, name, metric_type, completion_percentage, days_remaining, end_date, branch_id",
    )
    .gte("end_date", todayStr)
    .lte("days_remaining", DAYS_REMAINING_THRESHOLD);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const atRiskTargets = (targets ?? []).filter((row) => {
    const completion = Number(row.completion_percentage ?? 0);
    const daysRemaining = Number(row.days_remaining ?? 0);
    return (
      completion < COMPLETION_THRESHOLD &&
      daysRemaining >= 0 &&
      daysRemaining <= DAYS_REMAINING_THRESHOLD
    );
  });

  for (const target of atRiskTargets) {
    if (!target.target_id) {
      continue;
    }

    result.processed += 1;

    const metricLabel =
      TARGET_METRIC_TYPE_LABELS[
        (target.metric_type ?? "work_orders_completed") as TargetMetricType
      ] ?? target.metric_type;
    const completion = Number(target.completion_percentage ?? 0);
    const daysRemaining = Number(target.days_remaining ?? 0);
    const endLabel = target.end_date
      ? format(parseISO(target.end_date), "d MMMM yyyy", { locale: tr })
      : "—";

    try {
      const { data: targetRow, error: targetError } = await admin
        .from("targets")
        .select("id, created_by")
        .eq("id", target.target_id)
        .eq("status", "active")
        .maybeSingle();

      if (targetError) {
        throw new Error(targetError.message);
      }

      if (!targetRow) {
        result.skipped += 1;
        continue;
      }

      const { data: individuals, error: indError } = await admin
        .from("individual_targets")
        .select("user_id")
        .eq("target_id", target.target_id);

      if (indError) {
        throw new Error(indError.message);
      }

      const recipientIds = new Set<string>([targetRow.created_by]);
      for (const row of individuals ?? []) {
        recipientIds.add(row.user_id);
      }

      for (const userId of recipientIds) {
        const alreadySent = await hasNotificationToday(admin, {
          userId,
          type: "goal_at_risk",
          entityType: "target",
          entityId: target.target_id,
        });

        if (alreadySent) {
          result.skipped += 1;
          continue;
        }

        await insertNotification(admin, {
          userId,
          type: "goal_at_risk",
          title: "Hedef geride kalıyor",
          message: `“${target.name}” hedefi %${completion.toFixed(0)} tamamlandı (${metricLabel}). Bitiş: ${endLabel} (${daysRemaining} gün kaldı).`,
          entityType: "target",
          entityId: target.target_id,
          actionUrl: `/targets/${target.target_id}`,
          priority: daysRemaining <= 7 ? "high" : "normal",
        });

        result.created += 1;
      }
    } catch (err) {
      result.errors.push(
        `${target.name}: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`,
      );
    }
  }

  return result;
}
