"use server";

import { addDays, formatISO, startOfDay } from "date-fns";

import {
  computeContractRenewalBadge,
  computeDaysRemaining,
} from "@/lib/api/contracts/contract-badge";
import {
  DashboardApiError,
  getDashboardApiContext,
  toDashboardError,
} from "@/lib/api/dashboard/auth";
import type {
  DashboardContractStatusSummary,
  DashboardData,
  DashboardRenewalContract,
  DashboardServiceRequestItem,
  DashboardStockAlert,
  DashboardTargetSummaryItem,
  RawDashboardContractRow,
  RawDashboardServiceRequestRow,
} from "@/lib/api/dashboard/types";
import { getServiceRequestStatusVariant } from "@/lib/api/service-requests/service-request-status";
import type { TargetStatus } from "@/lib/constants/target";
import { matchesContractListFilter } from "@/lib/api/contracts/contract-badge";
import { fetchTargetProgressForRow } from "@/lib/api/targets/fetch-target-progress";
import { computeTargetDisplayStatus } from "@/lib/api/targets/target-progress-display";
import { isTrackedBranchStockRow } from "@/lib/api/stock/stock-helpers";
import type { RawCurrentStockRow } from "@/lib/api/stock/stock-list-helpers";
import type { PartUnit } from "@/lib/constants/stock-item";
import {
  OPEN_SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus,
} from "@/lib/constants/service-request";

const RENEWAL_LIST_LIMIT = 8;
const STOCK_ALERT_LIMIT = 8;
const RECENT_SERVICE_REQUEST_LIMIT = 5;
const ACTIVE_TARGET_LIMIT = 4;

const SERVICE_REQUEST_LIST_SELECT = `
  id,
  request_number,
  company_name,
  status,
  created_at,
  updated_at,
  assignee:users!service_requests_assigned_technician_id_fkey ( full_name )
`;

function mapServiceRequestRow(
  row: RawDashboardServiceRequestRow,
): DashboardServiceRequestItem {
  const status = row.status as ServiceRequestStatus;

  return {
    id: row.id,
    request_number: row.request_number,
    company_name: row.company_name,
    status,
    status_variant: getServiceRequestStatusVariant(status),
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_name: row.assignee?.full_name ?? null,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const ctx = await getDashboardApiContext();
    const branchId = ctx.branchScope;
    const todayStart = formatISO(startOfDay(new Date()));
    const tomorrowStart = formatISO(startOfDay(addDays(new Date(), 1)));

    let customersQuery = ctx.supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);

    let contractsQuery = ctx.supabase
      .from("contracts")
      .select(
        `
        id,
        contract_number,
        end_date,
        status,
        customers!contracts_customer_id_fkey ( name )
      `,
      )
      .is("deleted_at", null);

    let openServiceRequestsQuery = ctx.supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_SERVICE_REQUEST_STATUSES])
      .is("deleted_at", null);

    let recentServiceRequestsQuery = ctx.supabase
      .from("service_requests")
      .select(SERVICE_REQUEST_LIST_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(RECENT_SERVICE_REQUEST_LIMIT);

    let todayServiceRequestsQuery = ctx.supabase
      .from("service_requests")
      .select(SERVICE_REQUEST_LIST_SELECT)
      .is("deleted_at", null)
      .or(
        `and(created_at.gte.${todayStart},created_at.lt.${tomorrowStart}),and(updated_at.gte.${todayStart},updated_at.lt.${tomorrowStart})`,
      )
      .order("updated_at", { ascending: false });

    let stockQuery = ctx.supabase.from("current_stock").select("*");

    let targetsQuery = ctx.supabase
      .from("targets")
      .select("id, name, status, end_date, target_value, final_value")
      .eq("status", "active")
      .order("end_date", { ascending: true })
      .limit(ACTIVE_TARGET_LIMIT);

    const branchQuery = branchId
      ? ctx.supabase
          .from("branches")
          .select("name, code")
          .eq("id", branchId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    if (branchId) {
      customersQuery = customersQuery.eq("branch_id", branchId);
      contractsQuery = contractsQuery.eq("branch_id", branchId);
      openServiceRequestsQuery = openServiceRequestsQuery.eq("branch_id", branchId);
      recentServiceRequestsQuery = recentServiceRequestsQuery.eq(
        "branch_id",
        branchId,
      );
      todayServiceRequestsQuery = todayServiceRequestsQuery.eq(
        "branch_id",
        branchId,
      );
      stockQuery = stockQuery.eq("branch_id", branchId);
      targetsQuery = targetsQuery.eq("branch_id", branchId);
    }

    const [
      customersRes,
      contractsRes,
      openServiceRequestsRes,
      recentServiceRequestsRes,
      todayServiceRequestsRes,
      stockRes,
      branchRes,
      targetsRes,
    ] = await Promise.all([
      customersQuery,
      contractsQuery,
      openServiceRequestsQuery,
      recentServiceRequestsQuery,
      todayServiceRequestsQuery,
      stockQuery,
      branchQuery,
      targetsQuery,
    ]);

    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }
    if (contractsRes.error) {
      throw new Error(contractsRes.error.message);
    }
    if (openServiceRequestsRes.error) {
      throw new Error(openServiceRequestsRes.error.message);
    }
    if (recentServiceRequestsRes.error) {
      throw new Error(recentServiceRequestsRes.error.message);
    }
    if (todayServiceRequestsRes.error) {
      throw new Error(todayServiceRequestsRes.error.message);
    }
    if (stockRes.error) {
      throw new Error(stockRes.error.message);
    }
    if (branchRes.error) {
      throw new Error(branchRes.error.message);
    }
    if (targetsRes.error) {
      throw new Error(targetsRes.error.message);
    }

    const contractRows = (contractsRes.data ?? []) as RawDashboardContractRow[];
    const recentServiceRequests = (
      (recentServiceRequestsRes.data ?? []) as unknown as RawDashboardServiceRequestRow[]
    ).map(mapServiceRequestRow);
    const todayServiceRequests = (
      (todayServiceRequestsRes.data ?? []) as unknown as RawDashboardServiceRequestRow[]
    ).map(mapServiceRequestRow);

    const contractStatusSummary: DashboardContractStatusSummary = {
      active: 0,
      renewalNear: 0,
      ended: 0,
      draft: 0,
    };

    const renewalContracts: DashboardRenewalContract[] = [];

    for (const row of contractRows) {
      const badge = computeContractRenewalBadge(row.status, row.end_date);
      const days_remaining = computeDaysRemaining(row.end_date);

      if (matchesContractListFilter(row.status, badge, "draft")) {
        contractStatusSummary.draft += 1;
      } else if (matchesContractListFilter(row.status, badge, "ended")) {
        contractStatusSummary.ended += 1;
      } else if (matchesContractListFilter(row.status, badge, "renewal_near")) {
        contractStatusSummary.renewalNear += 1;
      } else if (matchesContractListFilter(row.status, badge, "active")) {
        contractStatusSummary.active += 1;
      }

      if (
        days_remaining >= 0 &&
        days_remaining <= 90 &&
        (badge === "warning_90" || badge === "critical_30")
      ) {
        renewalContracts.push({
          id: row.id,
          contract_number: row.contract_number,
          customer_name: row.customers?.name ?? "—",
          end_date: row.end_date,
          days_remaining,
        });
      }
    }

    renewalContracts.sort((a, b) => a.days_remaining - b.days_remaining);

    const activeContracts = contractRows.filter(
      (row) => row.status === "active",
    ).length;

    const partIds = new Set<string>();
    const stockAlerts: DashboardStockAlert[] = [];
    let criticalStockCount = 0;

    const trackedStockRows = ((stockRes.data ?? []) as RawCurrentStockRow[]).filter(
      (row) =>
        row.part_id &&
        row.branch_id &&
        isTrackedBranchStockRow(
          row.min_stock,
          Number(row.current_quantity ?? 0),
        ),
    );

    for (const row of trackedStockRows) {
      const qty = Number(row.current_quantity ?? 0);
      if (qty <= 0) continue;

      const status = row.stock_status;
      if (status === "critical") {
        criticalStockCount += 1;
      }

      if (status === "critical" || status === "warning") {
        partIds.add(row.part_id!);
        stockAlerts.push({
          part_id: row.part_id!,
          branch_id: row.branch_id!,
          part_code: row.part_code ?? "",
          description: row.description ?? "",
          branch_name: row.branch_name ?? "",
          current_quantity: qty,
          min_stock: Number(row.min_stock ?? 0),
          stock_status: status as "critical" | "warning",
          unit: "piece",
        });
      }
    }

    if (partIds.size > 0) {
      const { data: parts, error: partsError } = await ctx.supabase
        .from("parts")
        .select("id, unit")
        .in("id", [...partIds])
        .is("deleted_at", null);

      if (partsError) {
        throw new Error(partsError.message);
      }

      const unitByPartId = new Map(
        (parts ?? []).map((part) => [part.id, part.unit as PartUnit]),
      );

      for (const alert of stockAlerts) {
        alert.unit = unitByPartId.get(alert.part_id) ?? "piece";
      }
    }

    stockAlerts.sort((a, b) => {
      if (a.stock_status !== b.stock_status) {
        return a.stock_status === "critical" ? -1 : 1;
      }
      const ratioA = a.min_stock > 0 ? a.current_quantity / a.min_stock : 0;
      const ratioB = b.min_stock > 0 ? b.current_quantity / b.min_stock : 0;
      return ratioA - ratioB;
    });

    const targetRows = (targetsRes.data ?? []) as Array<{
      id: string;
      name: string;
      status: TargetStatus;
      end_date: string;
      target_value: number;
      final_value: number | null;
    }>;

    const activeTargets: DashboardTargetSummaryItem[] = await Promise.all(
      targetRows.map(async (row) => {
        const progress = await fetchTargetProgressForRow(ctx.supabase, row);
        const display = computeTargetDisplayStatus(
          row.status,
          row.end_date,
          progress.completion_percentage,
        );

        return {
          id: row.id,
          name: row.name,
          completion_percentage: progress.completion_percentage,
          days_remaining: progress.days_remaining,
          display_status: display.display_status,
        };
      }),
    );

    const branchLabel = branchId
      ? branchRes.data
        ? `${branchRes.data.name} (${branchRes.data.code})`
        : null
      : null;

    return {
      userName: ctx.user.full_name,
      isAdmin: ctx.permissions.isAdmin,
      branchLabel,
      summary: {
        activeCustomers: customersRes.count ?? 0,
        activeContracts,
        openServiceRequests: openServiceRequestsRes.count ?? 0,
        criticalStockCount,
      },
      renewalContracts: renewalContracts.slice(0, RENEWAL_LIST_LIMIT),
      stockAlerts: stockAlerts.slice(0, STOCK_ALERT_LIMIT),
      recentServiceRequests,
      contractStatusSummary,
      todayServiceRequests,
      activeTargets,
    };
  } catch (error) {
    if (error instanceof DashboardApiError) {
      throw error;
    }
    throw new Error(toDashboardError(error));
  }
}
