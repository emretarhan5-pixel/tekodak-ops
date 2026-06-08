"use server";

import {
  getServiceRequestApiContext,
  resolveBranchFilter,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import { matchesCreatedDateRange } from "@/lib/api/service-requests/service-request-helpers";
import { getServiceRequestStatusVariant } from "@/lib/api/service-requests/service-request-status";
import type {
  ServiceRequestListItem,
  ServiceRequestListResult,
} from "@/lib/api/service-requests/types";
import type {
  ServiceRequestStatus,
  ServiceRequestStep,
} from "@/lib/constants/service-request";
import {
  serviceRequestFilterSchema,
  type ServiceRequestFilterInput,
} from "@/schemas/service-request";

const LIST_SELECT = `
  id,
  request_number,
  company_name,
  contact_name,
  device_type,
  brand_model,
  serial_number,
  status,
  current_step,
  assigned_technician_id,
  under_warranty,
  branch_id,
  created_at,
  branches!service_requests_branch_id_fkey!inner (
    name,
    code
  ),
  technician:users!service_requests_assigned_technician_id_fkey (
    full_name
  )
`;

type RawListRow = {
  id: string;
  request_number: string;
  company_name: string;
  contact_name: string;
  device_type: string;
  brand_model: string;
  serial_number: string;
  status: ServiceRequestStatus;
  current_step: number;
  assigned_technician_id: string;
  under_warranty: boolean;
  branch_id: string;
  created_at: string;
  branches: { name: string; code: string };
  technician: { full_name: string } | null;
};

function mapRow(row: RawListRow): ServiceRequestListItem {
  return {
    id: row.id,
    request_number: row.request_number,
    company_name: row.company_name,
    contact_name: row.contact_name,
    device_type: row.device_type,
    brand_model: row.brand_model,
    serial_number: row.serial_number,
    status: row.status,
    status_variant: getServiceRequestStatusVariant(row.status),
    current_step: row.current_step as ServiceRequestStep,
    assigned_technician_id: row.assigned_technician_id,
    technician_name: row.technician?.full_name ?? "—",
    branch_id: row.branch_id,
    branch_name: row.branches.name,
    branch_code: row.branches.code,
    under_warranty: row.under_warranty,
    created_at: row.created_at,
  };
}

function matchesSearch(row: RawListRow, search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLocaleLowerCase("tr-TR");
  const haystack = [
    row.request_number,
    row.company_name,
    row.contact_name,
    row.serial_number,
    row.brand_model,
    row.device_type,
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");
  return haystack.includes(q);
}

export async function getServiceRequests(
  rawFilters: ServiceRequestFilterInput,
): Promise<ServiceRequestListResult> {
  try {
    const filters = serviceRequestFilterSchema.parse(rawFilters);
    const ctx = await getServiceRequestApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let query = ctx.supabase
      .from("service_requests")
      .select(LIST_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.assignedTechnicianId) {
      query = query.eq("assigned_technician_id", filters.assignedTechnicianId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as unknown as RawListRow[];
    const filtered = rows.filter(
      (row) =>
        matchesSearch(row, filters.search) &&
        matchesCreatedDateRange(row.created_at, filters.dateFrom, filters.dateTo),
    );

    const total = filtered.length;
    const start = (filters.page - 1) * filters.pageSize;
    const pageRows = filtered.slice(start, start + filters.pageSize);

    return {
      data: pageRows.map(mapRow),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
