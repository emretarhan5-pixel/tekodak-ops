"use server";

import { endOfMonth, formatISO, startOfMonth } from "date-fns";

import {
  DashboardApiError,
  getDashboardApiContext,
  toDashboardError,
} from "@/lib/api/dashboard/auth";
import type {
  StaffDashboardData,
  StaffDashboardServiceRequestItem,
  StaffDashboardWorkOrderItem,
} from "@/lib/api/dashboard/types";
import { getServiceRequestStatusVariant } from "@/lib/api/service-requests/service-request-status";
import { getWorkOrderStatusVariant } from "@/lib/api/work-orders/work-order-status";
import {
  OPEN_SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_STEP_LABELS,
  type ServiceRequestStatus,
  type ServiceRequestStep,
} from "@/lib/constants/service-request";
import type { WorkOrderStatus, WorkOrderType } from "@/lib/constants/work-order";
import {
  computePlannedDateUrgency,
  computeServiceRequestPlannedDate,
} from "@/lib/utils/staff-dashboard-planned-date";

const OPEN_WORK_ORDER_STATUSES = [
  "new",
  "assigned",
  "in_progress",
  "on_hold",
] as const;

const URGENCY_SORT_ORDER = {
  overdue: 0,
  urgent: 1,
  warning: 2,
  normal: 3,
} as const;

type RawServiceRequestRow = {
  id: string;
  request_number: string;
  company_name: string;
  device_type: string;
  brand_model: string;
  status: ServiceRequestStatus;
  current_step: number;
  created_at: string;
};

type RawWorkOrderRow = {
  id: string;
  work_order_number: string;
  work_type: WorkOrderType;
  status: WorkOrderStatus;
  scheduled_date: string | null;
  customers: { name: string } | null;
};

export async function getStaffDashboardData(): Promise<StaffDashboardData> {
  try {
    const ctx = await getDashboardApiContext();

    if (ctx.user.role !== "staff") {
      throw new DashboardApiError(
        "Teknisyen paneli yalnızca personel hesapları içindir",
        "FORBIDDEN",
      );
    }

    const userId = ctx.user.id;
    const monthStart = formatISO(startOfMonth(new Date()), {
      representation: "date",
    });
    const monthEnd = formatISO(endOfMonth(new Date()), {
      representation: "date",
    });

    const [serviceRequestsRes, workOrdersRes, completedRes] = await Promise.all([
      ctx.supabase
        .from("service_requests")
        .select(
          "id, request_number, company_name, device_type, brand_model, status, current_step, created_at",
        )
        .eq("assigned_technician_id", userId)
        .in("status", [...OPEN_SERVICE_REQUEST_STATUSES])
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      ctx.supabase
        .from("work_orders")
        .select(
          `
          id,
          work_order_number,
          work_type,
          status,
          scheduled_date,
          customers!work_orders_customer_id_fkey ( name )
        `,
        )
        .eq("assigned_to", userId)
        .in("status", [...OPEN_WORK_ORDER_STATUSES])
        .is("deleted_at", null)
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("assigned_technician_id", userId)
        .eq("status", "tamamlandi")
        .is("deleted_at", null)
        .gte("completed_at", `${monthStart}T00:00:00.000Z`)
        .lte("completed_at", `${monthEnd}T23:59:59.999Z`),
    ]);

    if (serviceRequestsRes.error) {
      throw new Error(serviceRequestsRes.error.message);
    }
    if (workOrdersRes.error) {
      throw new Error(workOrdersRes.error.message);
    }
    if (completedRes.error) {
      throw new Error(completedRes.error.message);
    }

    const openServiceRequests = (
      (serviceRequestsRes.data ?? []) as RawServiceRequestRow[]
    )
      .map((row): StaffDashboardServiceRequestItem => {
        const step = row.current_step as ServiceRequestStep;
        const planned_date = computeServiceRequestPlannedDate(row.created_at);
        const { daysRemaining, urgency } =
          computePlannedDateUrgency(planned_date);

        return {
          id: row.id,
          request_number: row.request_number,
          company_name: row.company_name,
          device_label: `${row.device_type} · ${row.brand_model}`,
          current_step: step,
          step_label: `Adım ${step} — ${SERVICE_REQUEST_STEP_LABELS[step]}`,
          status: row.status,
          status_variant: getServiceRequestStatusVariant(row.status),
          planned_date,
          days_remaining: daysRemaining,
          urgency,
        };
      })
      .sort((a, b) => {
        const urgencyDiff =
          URGENCY_SORT_ORDER[a.urgency] - URGENCY_SORT_ORDER[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.planned_date.localeCompare(b.planned_date);
      });

    const openWorkOrders = (
      (workOrdersRes.data ?? []) as unknown as RawWorkOrderRow[]
    ).map(
      (row): StaffDashboardWorkOrderItem => ({
        id: row.id,
        work_order_number: row.work_order_number,
        customer_name: row.customers?.name ?? "—",
        work_type: row.work_type,
        scheduled_date: row.scheduled_date,
        status: row.status,
        status_variant: getWorkOrderStatusVariant(row.status),
      }),
    );

    return {
      userName: ctx.user.full_name,
      openServiceRequests,
      openWorkOrders,
      summary: {
        completedServiceRequestsThisMonth: completedRes.count ?? 0,
        openServiceRequestsCount: openServiceRequests.length,
        openWorkOrdersCount: openWorkOrders.length,
      },
    };
  } catch (error) {
    if (error instanceof DashboardApiError) {
      throw error;
    }
    throw new Error(toDashboardError(error));
  }
}
