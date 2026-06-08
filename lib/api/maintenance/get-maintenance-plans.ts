"use server";

import {
  getMaintenanceApiContext,
  MaintenanceApiError,
  toMaintenanceError,
} from "@/lib/api/maintenance/auth";
import { maintenanceStatusVariant } from "@/lib/api/maintenance/maintenance-helpers";
import type { MaintenancePlanListItem } from "@/lib/api/maintenance/types";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import { computePlannedDateUrgency } from "@/lib/utils/planned-date-urgency";

const PLAN_LIST_SELECT = `
  id,
  contract_id,
  branch_id,
  planned_date,
  status,
  notes,
  completed_at,
  created_at,
  assigned_technician_id,
  contracts!periodic_maintenance_plans_contract_id_fkey!inner (
    contract_number,
    customers!contracts_customer_id_fkey!inner ( name )
  ),
  technician:users!periodic_maintenance_plans_assigned_technician_id_fkey (
    full_name
  ),
  periodic_maintenance_devices (
    id,
    is_completed
  )
`;

type RawPlanListRow = {
  id: string;
  contract_id: string;
  branch_id: string;
  planned_date: string;
  status: MaintenancePlanStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  assigned_technician_id: string;
  contracts: {
    contract_number: string;
    customers: { name: string };
  };
  technician: { full_name: string } | null;
  periodic_maintenance_devices: Array<{ id: string; is_completed: boolean }>;
};

export type GetMaintenancePlansByContractFilters = {
  status?: MaintenancePlanStatus[];
  technicianId?: string;
};

function mapPlanListRow(row: RawPlanListRow): MaintenancePlanListItem {
  const deviceCount = row.periodic_maintenance_devices.length;
  const completedDeviceCount = row.periodic_maintenance_devices.filter(
    (d) => d.is_completed,
  ).length;
  const { daysRemaining, urgency } = computePlannedDateUrgency(row.planned_date);

  return {
    id: row.id,
    contract_id: row.contract_id,
    contract_number: row.contracts.contract_number,
    customer_name: row.contracts.customers.name,
    branch_id: row.branch_id,
    planned_date: row.planned_date,
    status: row.status,
    status_variant: maintenanceStatusVariant(row.status),
    assigned_technician_id: row.assigned_technician_id,
    technician_name: row.technician?.full_name ?? "—",
    device_count: deviceCount,
    completed_device_count: completedDeviceCount,
    days_remaining: daysRemaining,
    urgency,
    notes: row.notes,
    completed_at: row.completed_at,
    created_at: row.created_at,
  };
}

export async function getMaintenancePlansByContract(
  contractId: string,
  filters: GetMaintenancePlansByContractFilters = {},
): Promise<MaintenancePlanListItem[]> {
  try {
    const ctx = await getMaintenanceApiContext();

    const { data: contract, error: contractError } = await ctx.supabase
      .from("contracts")
      .select("id, branch_id")
      .eq("id", contractId)
      .is("deleted_at", null)
      .maybeSingle();

    if (contractError) {
      throw new Error(contractError.message);
    }

    if (!contract) {
      throw new MaintenanceApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    if (ctx.branchScope && ctx.branchScope !== contract.branch_id) {
      throw new MaintenanceApiError("Bu sözleşme için yetkiniz yok", "FORBIDDEN");
    }

    let query = ctx.supabase
      .from("periodic_maintenance_plans")
      .select(PLAN_LIST_SELECT)
      .eq("contract_id", contractId)
      .is("deleted_at", null)
      .order("planned_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.status?.length) {
      query = query.in("status", filters.status);
    }

    if (filters.technicianId) {
      query = query.eq("assigned_technician_id", filters.technicianId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as unknown as RawPlanListRow[]).map(mapPlanListRow);
  } catch (error) {
    if (error instanceof MaintenanceApiError) {
      throw error;
    }
    throw new Error(toMaintenanceError(error));
  }
}
