import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import { getAppBaseUrl } from "@/lib/email/config";
import { sendWorkOrderAssignedEmail } from "@/lib/email/send-work-order-assigned";
import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";

export async function triggerWorkOrderAssignedEmail(
  supabase: AppSupabaseClient,
  params: {
    workOrderId: string;
    assignedToUserId: string;
  },
): Promise<void> {
  try {
    const { data: assignee, error: userError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", params.assignedToUserId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (userError || !assignee?.email) {
      return;
    }

    const { data: wo, error: woError } = await supabase
      .from("work_orders")
      .select(
        `
        id,
        work_order_number,
        scheduled_date,
        scheduled_time,
        customers!work_orders_customer_id_fkey ( name )
      `,
      )
      .eq("id", params.workOrderId)
      .maybeSingle();

    if (woError || !wo) {
      return;
    }

    const customerName =
      (wo.customers as { name: string } | null)?.name ?? "Müşteri";

    let scheduledLabel = "Belirtilmedi";
    if (wo.scheduled_date) {
      const datePart = format(parseISO(wo.scheduled_date), "d MMMM yyyy", {
        locale: tr,
      });
      scheduledLabel = wo.scheduled_time
        ? `${datePart}, ${wo.scheduled_time.slice(0, 5)}`
        : datePart;
    }

    const baseUrl = getAppBaseUrl();

    await sendWorkOrderAssignedEmail({
      to: assignee.email,
      assigneeName: assignee.full_name,
      workOrderNumber: wo.work_order_number,
      customerName,
      scheduledLabel,
      workOrderUrl: `${baseUrl}/work-orders/${wo.id}`,
    });
  } catch (error) {
    console.error(
      "[email] İş emri atama e-postası gönderilemedi:",
      error instanceof Error ? error.message : error,
    );
  }
}
