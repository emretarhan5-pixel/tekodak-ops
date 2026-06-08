import {
  MaintenanceApiError,
  assertCanAccessBranch,
  type MaintenanceApiContext,
  type MaintenancePlanAccessRow,
} from "@/lib/api/maintenance/auth";
import {
  MAINTENANCE_PLAN_STATUS_VARIANTS,
  OPEN_MAINTENANCE_PLAN_STATUSES,
  type MaintenancePlanStatus,
} from "@/lib/constants/maintenance";
import type { MaintenancePlanStatusBadgeVariant } from "@/lib/constants/maintenance";

export type MaintenancePlanRow = MaintenancePlanAccessRow & {
  id: string;
  contract_id: string;
  planned_date: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractMaintenanceQuota = {
  contract_id: string;
  branch_id: string;
  total_maintenance_count: number;
  completed_maintenance_count: number;
  open_plan_count: number;
  remaining_maintenance_count: number;
};

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export function maintenanceStatusVariant(
  status: MaintenancePlanStatus,
): MaintenancePlanStatusBadgeVariant {
  return MAINTENANCE_PLAN_STATUS_VARIANTS[status];
}

export async function loadMaintenancePlanRow(
  ctx: MaintenanceApiContext,
  planId: string,
): Promise<MaintenancePlanRow> {
  const { data, error } = await ctx.supabase
    .from("periodic_maintenance_plans")
    .select(
      "id, contract_id, branch_id, planned_date, assigned_technician_id, status, notes, completed_at, created_at, updated_at, deleted_at",
    )
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.deleted_at) {
    throw new MaintenanceApiError("Bakım planı bulunamadı", "NOT_FOUND");
  }

  return data as MaintenancePlanRow;
}

export function assertMaintenancePlanStatus(
  row: Pick<MaintenancePlanRow, "status">,
  allowed: readonly MaintenancePlanStatus[],
): void {
  if (!allowed.includes(row.status)) {
    throw new MaintenanceApiError(
      "Bu işlem mevcut plan durumu için geçerli değil",
      "FORBIDDEN",
    );
  }
}

export async function loadContractMaintenanceQuota(
  ctx: MaintenanceApiContext,
  contractId: string,
): Promise<ContractMaintenanceQuota> {
  const { data: contract, error: contractError } = await ctx.supabase
    .from("contracts")
    .select(
      "id, branch_id, total_maintenance_count, completed_maintenance_count",
    )
    .eq("id", contractId)
    .is("deleted_at", null)
    .maybeSingle();

  if (contractError) {
    throw new Error(contractError.message);
  }

  if (!contract) {
    throw new MaintenanceApiError("Sözleşme bulunamadı", "NOT_FOUND");
  }

  assertCanAccessBranch(ctx, contract.branch_id);

  const { count: openPlanCount, error: openError } = await ctx.supabase
    .from("periodic_maintenance_plans")
    .select("id", { count: "exact", head: true })
    .eq("contract_id", contractId)
    .in("status", [...OPEN_MAINTENANCE_PLAN_STATUSES])
    .is("deleted_at", null);

  if (openError) {
    throw new Error(openError.message);
  }

  const total = contract.total_maintenance_count ?? 0;
  const completed = contract.completed_maintenance_count ?? 0;
  const open = openPlanCount ?? 0;
  const remaining = total - completed - open;

  return {
    contract_id: contract.id,
    branch_id: contract.branch_id,
    total_maintenance_count: total,
    completed_maintenance_count: completed,
    open_plan_count: open,
    remaining_maintenance_count: remaining,
  };
}

export async function validateAssignedTechnician(
  ctx: MaintenanceApiContext,
  technicianId: string,
  branchId: string,
): Promise<void> {
  const { data: technician, error } = await ctx.supabase
    .from("users")
    .select("id, role, branch_id, is_active, deleted_at")
    .eq("id", technicianId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (
    !technician ||
    !technician.is_active ||
    technician.deleted_at ||
    technician.role !== "staff" ||
    technician.branch_id !== branchId
  ) {
    throw new MaintenanceApiError("Geçerli bir teknisyen seçin", "FORBIDDEN");
  }
}

export type ValidatedContractDevice = {
  device_id: string;
  serial_number: string;
};

export async function validateContractDevices(
  ctx: MaintenanceApiContext,
  contractId: string,
  deviceIds: string[],
): Promise<ValidatedContractDevice[]> {
  const uniqueIds = [...new Set(deviceIds)];

  if (uniqueIds.length === 0) {
    throw new MaintenanceApiError("En az bir cihaz seçin", "FORBIDDEN");
  }

  const { data: links, error } = await ctx.supabase
    .from("contract_devices")
    .select(
      `
      device_id,
      devices!contract_devices_device_id_fkey!inner (
        id,
        serial_number,
        deleted_at
      )
    `,
    )
    .eq("contract_id", contractId)
    .is("removed_at", null)
    .in("device_id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  type RawContractDeviceLink = {
    device_id: string;
    devices: {
      id: string;
      serial_number: string;
      deleted_at: string | null;
    };
  };

  const validated: ValidatedContractDevice[] = [];
  const rows = (links ?? []) as unknown as RawContractDeviceLink[];

  for (const deviceId of uniqueIds) {
    const link = rows.find(
      (row) => row.device_id === deviceId && !row.devices.deleted_at,
    );

    if (!link) {
      throw new MaintenanceApiError(
        "Seçilen cihazlardan biri bu sözleşmeye ait değil",
        "FORBIDDEN",
      );
    }

    const serial = link.devices.serial_number?.trim();

    if (!serial) {
      throw new MaintenanceApiError(
        "Cihaz seri numarası eksik — önce cihaz kaydını güncelleyin",
        "FORBIDDEN",
      );
    }

    validated.push({ device_id: deviceId, serial_number: serial });
  }

  return validated;
}
