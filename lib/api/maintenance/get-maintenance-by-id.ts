"use server";

import {
  assertCanAccessBranch,
  getMaintenanceApiContext,
  MaintenanceApiError,
  toMaintenanceError,
} from "@/lib/api/maintenance/auth";
import {
  loadContractMaintenanceQuota,
  maintenanceStatusVariant,
} from "@/lib/api/maintenance/maintenance-helpers";
import type { MaintenancePlanDetail } from "@/lib/api/maintenance/types";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import { computePlannedDateUrgency } from "@/lib/utils/planned-date-urgency";

const PLAN_DETAIL_SELECT = `
  id,
  contract_id,
  branch_id,
  planned_date,
  status,
  notes,
  completed_at,
  created_at,
  updated_at,
  assigned_technician_id,
  contracts!periodic_maintenance_plans_contract_id_fkey!inner (
    contract_number,
    customer_id,
    customers!contracts_customer_id_fkey!inner ( id, name )
  ),
  branches!periodic_maintenance_plans_branch_id_fkey!inner (
    name
  ),
  technician:users!periodic_maintenance_plans_assigned_technician_id_fkey (
    full_name
  )
`;

const PLAN_DEVICES_SELECT = `
  id,
  device_id,
  serial_number,
  work_notes,
  is_completed,
  completed_at,
  devices!periodic_maintenance_devices_device_id_fkey!inner (
    brands!devices_brand_id_fkey!inner ( name ),
    device_models!devices_model_id_fkey!inner ( model_name )
  )
`;

type RawPlanDetailRow = {
  id: string;
  contract_id: string;
  branch_id: string;
  planned_date: string;
  status: MaintenancePlanStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_technician_id: string;
  contracts: {
    contract_number: string;
    customer_id: string;
    customers: { id: string; name: string };
  };
  branches: { name: string };
  technician: { full_name: string } | null;
};

export async function getMaintenanceById(
  planId: string,
): Promise<MaintenancePlanDetail> {
  try {
    const ctx = await getMaintenanceApiContext();

    const { data: plan, error: planError } = await ctx.supabase
      .from("periodic_maintenance_plans")
      .select(PLAN_DETAIL_SELECT)
      .eq("id", planId)
      .is("deleted_at", null)
      .maybeSingle();

    if (planError) {
      throw new Error(planError.message);
    }

    if (!plan) {
      throw new MaintenanceApiError("Bakım planı bulunamadı", "NOT_FOUND");
    }

    const row = plan as unknown as RawPlanDetailRow;
    assertCanAccessBranch(ctx, row.branch_id);

    const [devicesRes, quota] = await Promise.all([
      ctx.supabase
        .from("periodic_maintenance_devices")
        .select(PLAN_DEVICES_SELECT)
        .eq("maintenance_plan_id", planId)
        .order("created_at", { ascending: true }),
      loadContractMaintenanceQuota(ctx, row.contract_id),
    ]);

    if (devicesRes.error) {
      throw new Error(devicesRes.error.message);
    }

    const { daysRemaining, urgency } = computePlannedDateUrgency(row.planned_date);

    const devices = ((devicesRes.data ?? []) as unknown as Array<{
      id: string;
      device_id: string;
      serial_number: string;
      work_notes: string | null;
      is_completed: boolean;
      completed_at: string | null;
      devices: {
        brands: { name: string };
        device_models: { model_name: string };
      };
    }>).map((device) => ({
      id: device.id,
      device_id: device.device_id,
      serial_number: device.serial_number,
      brand_name: device.devices.brands.name,
      model_name: device.devices.device_models.model_name,
      work_notes: device.work_notes,
      is_completed: device.is_completed,
      completed_at: device.completed_at,
    }));

    return {
      id: row.id,
      contract_id: row.contract_id,
      contract_number: row.contracts.contract_number,
      customer_id: row.contracts.customers.id,
      customer_name: row.contracts.customers.name,
      branch_id: row.branch_id,
      branch_name: row.branches.name,
      planned_date: row.planned_date,
      status: row.status,
      status_variant: maintenanceStatusVariant(row.status),
      assigned_technician_id: row.assigned_technician_id,
      technician_name: row.technician?.full_name ?? "—",
      notes: row.notes,
      completed_at: row.completed_at,
      days_remaining: daysRemaining,
      urgency,
      total_maintenance_count: quota.total_maintenance_count,
      completed_maintenance_count: quota.completed_maintenance_count,
      remaining_maintenance_count: quota.remaining_maintenance_count,
      devices,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    if (error instanceof MaintenanceApiError) {
      throw error;
    }
    throw new Error(toMaintenanceError(error));
  }
}
