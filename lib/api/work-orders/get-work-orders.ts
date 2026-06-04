"use server";

import {
  getWorkOrderApiContext,
  resolveBranchFilter,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import {
  matchesDateRange,
  prioritySortRank,
} from "@/lib/api/work-orders/work-order-helpers";
import { getWorkOrderStatusVariant } from "@/lib/api/work-orders/work-order-status";
import type { WorkOrderListItem, WorkOrderListResult } from "@/lib/api/work-orders/types";
import type {
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@/lib/constants/work-order";
import { workOrderFilterSchema, type WorkOrderFilterInput } from "@/schemas/work-order";

const WORK_ORDER_LIST_SELECT = `
  id,
  work_order_number,
  customer_id,
  device_id,
  work_type,
  status,
  priority,
  assigned_to,
  scheduled_date,
  sla_deadline,
  sla_breached,
  branch_id,
  created_at,
  customers!work_orders_customer_id_fkey!inner (
    id,
    name
  ),
  branches!work_orders_branch_id_fkey!inner (
    name,
    code
  ),
  devices!work_orders_device_id_fkey (
    serial_number,
    brands!devices_brand_id_fkey ( name ),
    device_models!devices_model_id_fkey ( model_name )
  ),
  assignee:users!work_orders_assigned_to_fkey (
    full_name
  )
`;

type RawWorkOrderRow = {
  id: string;
  work_order_number: string;
  customer_id: string;
  device_id: string | null;
  work_type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assigned_to: string | null;
  scheduled_date: string | null;
  sla_deadline: string | null;
  sla_breached: boolean | null;
  branch_id: string;
  created_at: string;
  customers: { id: string; name: string };
  branches: { name: string; code: string };
  devices: {
    serial_number: string;
    brands: { name: string } | null;
    device_models: { model_name: string } | null;
  } | null;
  assignee: { full_name: string } | null;
};

function formatDeviceLabel(
  device: RawWorkOrderRow["devices"],
): string | null {
  if (!device) return null;
  const brand = device.brands?.name ?? "";
  const model = device.device_models?.model_name ?? "";
  const parts = [device.serial_number, brand, model].filter(Boolean);
  return parts.join(" · ") || device.serial_number;
}

function mapRow(row: RawWorkOrderRow): WorkOrderListItem {
  return {
    id: row.id,
    work_order_number: row.work_order_number,
    customer_id: row.customer_id,
    customer_name: row.customers.name,
    device_id: row.device_id,
    device_label: formatDeviceLabel(row.devices),
    work_type: row.work_type,
    status: row.status,
    status_variant: getWorkOrderStatusVariant(row.status),
    priority: row.priority,
    assigned_to: row.assigned_to,
    assignee_name: row.assignee?.full_name ?? null,
    scheduled_date: row.scheduled_date,
    branch_id: row.branch_id,
    branch_name: row.branches.name,
    branch_code: row.branches.code,
    sla_deadline: row.sla_deadline,
    sla_breached: row.sla_breached ?? false,
    created_at: row.created_at,
  };
}

export async function getWorkOrders(
  rawFilters: WorkOrderFilterInput,
): Promise<WorkOrderListResult> {
  try {
    const filters = workOrderFilterSchema.parse(rawFilters);
    const ctx = await getWorkOrderApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let query = ctx.supabase
      .from("work_orders")
      .select(WORK_ORDER_LIST_SELECT)
      .is("deleted_at", null);

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (filters.customerId) {
      query = query.eq("customer_id", filters.customerId);
    }

    if (filters.deviceId) {
      query = query.eq("device_id", filters.deviceId);
    }

    if (filters.contractId) {
      query = query.eq("contract_id", filters.contractId);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.workType) {
      query = query.eq("work_type", filters.workType);
    }

    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters.assignedTo) {
      query = query.eq("assigned_to", filters.assignedTo);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, "\\%");
      query = query.or(
        `work_order_number.ilike.%${term}%,customers.name.ilike.%${term}%`,
      );
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rawRows = (rows ?? []) as unknown as RawWorkOrderRow[];

    let mapped = rawRows.map(mapRow);

    if (filters.dateFrom || filters.dateTo) {
      mapped = mapped.filter((row) =>
        matchesDateRange(row.scheduled_date, filters.dateFrom, filters.dateTo),
      );
    }

    mapped.sort((a, b) => {
      const pr = prioritySortRank(b.priority) - prioritySortRank(a.priority);
      if (pr !== 0) return pr;
      const da = a.scheduled_date ?? "9999-12-31";
      const db = b.scheduled_date ?? "9999-12-31";
      if (da !== db) return da.localeCompare(db);
      return b.created_at.localeCompare(a.created_at);
    });

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
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
