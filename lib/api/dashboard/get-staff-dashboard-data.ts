"use server";

import { endOfMonth, formatISO, startOfMonth } from "date-fns";

import {
  DashboardApiError,
  getDashboardApiContext,
  toDashboardError,
} from "@/lib/api/dashboard/auth";
import { maintenanceStatusVariant } from "@/lib/api/maintenance/maintenance-helpers";
import { fetchTargetProgressForRow } from "@/lib/api/targets/fetch-target-progress";
import type {
  StaffDashboardData,
  StaffDashboardMaintenancePlanItem,
  StaffDashboardServiceRequestItem,
} from "@/lib/api/dashboard/types";
import { OPEN_MAINTENANCE_PLAN_STATUSES } from "@/lib/constants/maintenance";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import { getServiceRequestStatusVariant } from "@/lib/api/service-requests/service-request-status";
import {
  OPEN_SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_STEP_LABELS,
  type ServiceRequestStatus,
  type ServiceRequestStep,
} from "@/lib/constants/service-request";
import type { TargetStatus } from "@/lib/constants/target";
import {
  computePlannedDateUrgency,
  computeServiceRequestPlannedDate,
} from "@/lib/utils/staff-dashboard-planned-date";

const URGENCY_SORT_ORDER = {
  overdue: 0,
  urgent: 1,
  warning: 2,
  normal: 3,
} as const;

const URGENT_URGENCIES = new Set(["overdue", "urgent"]);

function isUrgentUrgency(urgency: keyof typeof URGENCY_SORT_ORDER): boolean {
  return URGENT_URGENCIES.has(urgency);
}

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

type RawMaintenancePlanRow = {
  id: string;
  planned_date: string;
  status: MaintenancePlanStatus;
  contracts: {
    contract_number: string;
    customers: { name: string };
  };
  periodic_maintenance_devices: Array<{ id: string }>;
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

    const branchId = ctx.user.branch_id;

    const [serviceRequestsRes, maintenancePlansRes, completedRes, branchRes, targetsRes] =
      await Promise.all([
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
        .from("periodic_maintenance_plans")
        .select(
          `
          id,
          planned_date,
          status,
          contracts!periodic_maintenance_plans_contract_id_fkey!inner (
            contract_number,
            customers!contracts_customer_id_fkey!inner ( name )
          ),
          periodic_maintenance_devices ( id )
        `,
        )
        .eq("assigned_technician_id", userId)
        .in("status", [...OPEN_MAINTENANCE_PLAN_STATUSES])
        .is("deleted_at", null)
        .order("planned_date", { ascending: true }),
      ctx.supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("assigned_technician_id", userId)
        .eq("status", "tamamlandi")
        .is("deleted_at", null)
        .gte("completed_at", `${monthStart}T00:00:00.000Z`)
        .lte("completed_at", `${monthEnd}T23:59:59.999Z`),
      branchId
        ? ctx.supabase
            .from("branches")
            .select("name")
            .eq("id", branchId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      branchId
        ? ctx.supabase
            .from("targets")
            .select("id, name, status, end_date, target_value, final_value")
            .eq("status", "active")
            .eq("branch_id", branchId)
            .order("end_date", { ascending: true })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      ]);

    if (serviceRequestsRes.error) {
      throw new Error(serviceRequestsRes.error.message);
    }
    if (maintenancePlansRes.error) {
      throw new Error(maintenancePlansRes.error.message);
    }
    if (completedRes.error) {
      throw new Error(completedRes.error.message);
    }
    if (branchRes.error) {
      throw new Error(branchRes.error.message);
    }
    if (targetsRes.error) {
      throw new Error(targetsRes.error.message);
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

    const openMaintenancePlans = (
      (maintenancePlansRes.data ?? []) as unknown as RawMaintenancePlanRow[]
    )
      .map((row): StaffDashboardMaintenancePlanItem => {
        const { daysRemaining, urgency } = computePlannedDateUrgency(
          row.planned_date,
        );

        return {
          id: row.id,
          contract_number: row.contracts.contract_number,
          customer_name: row.contracts.customers.name,
          planned_date: row.planned_date,
          days_remaining: daysRemaining,
          urgency,
          device_count: row.periodic_maintenance_devices.length,
          status: row.status,
          status_variant: maintenanceStatusVariant(row.status),
        };
      })
      .sort((a, b) => {
        const urgencyDiff =
          URGENCY_SORT_ORDER[a.urgency] - URGENCY_SORT_ORDER[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.planned_date.localeCompare(b.planned_date);
      });

    const urgentServiceRequestsCount = openServiceRequests.filter((item) =>
      isUrgentUrgency(item.urgency),
    ).length;
    const urgentMaintenancePlansCount = openMaintenancePlans.filter((item) =>
      isUrgentUrgency(item.urgency),
    ).length;

    const inProgressCount =
      openServiceRequests.filter((item) => item.status === "bakim_yapiliyor")
        .length +
      openMaintenancePlans.filter((item) => item.status === "in_progress")
        .length;

    const openTotalCount =
      openServiceRequests.length + openMaintenancePlans.length;

    let activeTarget: StaffDashboardData["activeTarget"] = null;
    const targetRow = targetsRes.data as {
      id: string;
      name: string;
      status: TargetStatus;
      end_date: string;
      target_value: number;
      final_value: number | null;
    } | null;

    if (targetRow) {
      const progress = await fetchTargetProgressForRow(ctx.supabase, targetRow);
      activeTarget = {
        id: targetRow.id,
        name: targetRow.name,
        completion_percentage: progress.completion_percentage,
        days_remaining: progress.days_remaining,
      };
    }

    const branchRow = branchRes.data as { name: string } | null;

    return {
      userName: ctx.user.full_name,
      branchName: branchRow?.name ?? "—",
      openServiceRequests,
      openMaintenancePlans,
      summary: {
        completedServiceRequestsThisMonth: completedRes.count ?? 0,
        openServiceRequestsCount: openServiceRequests.length,
        openMaintenancePlansCount: openMaintenancePlans.length,
        urgentServiceRequestsCount,
        urgentMaintenancePlansCount,
      },
      performance: {
        completedThisMonth: completedRes.count ?? 0,
        inProgressCount,
        openTotalCount,
      },
      activeTarget,
    };
  } catch (error) {
    if (error instanceof DashboardApiError) {
      throw error;
    }
    throw new Error(toDashboardError(error));
  }
}
