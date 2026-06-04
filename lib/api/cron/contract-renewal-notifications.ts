import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import {
  hasNotificationToday,
  insertNotification,
} from "@/lib/api/cron/notification-insert";
import type { CronJobResult } from "@/lib/api/cron/types";
import { RENEWABLE_STATUSES } from "@/lib/api/contracts/renewal-helpers";
import { getAppBaseUrl } from "@/lib/email/config";
import { sendContractRenewalEmail } from "@/lib/email/send-contract-renewal";
import { createAdminClient } from "@/lib/supabase/admin";

const RENEWAL_WINDOW_DAYS = 90;

export async function runContractRenewalNotifications(): Promise<CronJobResult> {
  const admin = createAdminClient();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const windowEnd = format(addDays(today, RENEWAL_WINDOW_DAYS), "yyyy-MM-dd");

  const result: CronJobResult = {
    job: "contract-renewals",
    processed: 0,
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [],
  };

  const baseUrl = getAppBaseUrl();

  const { data: contracts, error } = await admin
    .from("contracts")
    .select(
      `
      id,
      contract_number,
      end_date,
      status,
      responsible_user_id,
      customers!contracts_customer_id_fkey ( name )
    `,
    )
    .is("deleted_at", null)
    .in("status", [...RENEWABLE_STATUSES])
    .gte("end_date", todayStr)
    .lte("end_date", windowEnd);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const contract of contracts ?? []) {
    result.processed += 1;

    const customerName =
      (contract.customers as { name: string } | null)?.name ?? "Müşteri";
    const daysRemaining = differenceInCalendarDays(
      parseISO(contract.end_date),
      today,
    );

    try {
      const alreadySent = await hasNotificationToday(admin, {
        userId: contract.responsible_user_id,
        type: "contract_renewal",
        entityType: "contract",
        entityId: contract.id,
      });

      if (alreadySent) {
        result.skipped += 1;
        continue;
      }

      const endLabel = format(parseISO(contract.end_date), "d MMMM yyyy", {
        locale: tr,
      });

      await insertNotification(admin, {
        userId: contract.responsible_user_id,
        type: "contract_renewal",
        title: "Sözleşme yenileme yaklaşıyor",
        message: `${customerName} — ${contract.contract_number} sözleşmesinin bitiş tarihi ${daysRemaining} gün sonra (${endLabel}).`,
        entityType: "contract",
        entityId: contract.id,
        actionUrl: `/contracts/${contract.id}`,
        priority: daysRemaining <= 30 ? "high" : "normal",
      });

      result.created += 1;

      try {
        const { data: responsible } = await admin
          .from("users")
          .select("email")
          .eq("id", contract.responsible_user_id)
          .maybeSingle();

        if (responsible?.email) {
          const emailResult = await sendContractRenewalEmail({
            to: responsible.email,
            customerName,
            contractNumber: contract.contract_number,
            endDateLabel: endLabel,
            daysRemaining,
            renewUrl: `${baseUrl}/contracts/${contract.id}`,
          });
          if (emailResult.sent) {
            result.emailsSent += 1;
          }
        }
      } catch (emailErr) {
        console.error(
          "[cron:contract-renewals] E-posta gönderilemedi:",
          contract.contract_number,
          emailErr instanceof Error ? emailErr.message : emailErr,
        );
      }
    } catch (err) {
      result.errors.push(
        `${contract.contract_number}: ${
          err instanceof Error ? err.message : "Bilinmeyen hata"
        }`,
      );
    }
  }

  return result;
}
