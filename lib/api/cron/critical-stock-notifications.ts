import {
  hasNotificationToday,
  insertNotification,
} from "@/lib/api/cron/notification-insert";
import type { CronJobResult } from "@/lib/api/cron/types";
import { createAdminClient } from "@/lib/supabase/admin";

async function getBranchNotifyUserIds(
  admin: ReturnType<typeof createAdminClient>,
  branchId: string,
): Promise<string[]> {
  const { data: staff, error: staffError } = await admin
    .from("users")
    .select("id")
    .eq("role", "staff")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (staff && staff.length > 0) {
    return staff.map((row) => row.id);
  }

  const { data: admins, error: adminError } = await admin
    .from("users")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (adminError) {
    throw new Error(adminError.message);
  }

  return (admins ?? []).map((row) => row.id);
}

export async function runCriticalStockNotifications(): Promise<CronJobResult> {
  const admin = createAdminClient();

  const result: CronJobResult = {
    job: "critical-stock",
    processed: 0,
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [],
  };

  await admin.rpc("refresh_current_stock");

  const { data: rows, error } = await admin
    .from("current_stock")
    .select(
      "part_id, part_code, description, branch_id, branch_name, current_quantity, min_stock, stock_status",
    )
    .eq("stock_status", "critical");

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const row of rows ?? []) {
    if (!row.part_id || !row.branch_id) {
      continue;
    }

    result.processed += 1;

    const partCode = row.part_code ?? "Parça";
    const branchName = row.branch_name ?? "Şube";
    const title = `Kritik stok: ${partCode} — ${branchName}`;
    const quantity = Number(row.current_quantity ?? 0);
    const minStock = Number(row.min_stock ?? 0);

    try {
      const userIds = await getBranchNotifyUserIds(admin, row.branch_id);

      for (const userId of userIds) {
        const alreadySent = await hasNotificationToday(admin, {
          userId,
          type: "critical_stock",
          entityType: "part_branch",
          entityId: row.part_id,
          title,
        });

        if (alreadySent) {
          result.skipped += 1;
          continue;
        }

        await insertNotification(admin, {
          userId,
          type: "critical_stock",
          title,
          message: `${partCode} (${row.description ?? "—"}) — ${branchName} şubesinde stok kritik seviyede. Mevcut: ${quantity}, minimum: ${minStock}.`,
          entityType: "part_branch",
          entityId: row.part_id,
          actionUrl: `/stock/${row.part_id}`,
          priority: "urgent",
        });

        result.created += 1;
      }
    } catch (err) {
      result.errors.push(
        `${partCode}/${branchName}: ${
          err instanceof Error ? err.message : "Bilinmeyen hata"
        }`,
      );
    }
  }

  return result;
}
