"use server";

import {
  getMaintenanceApiContext,
  MaintenanceApiError,
  toMaintenanceError,
} from "@/lib/api/maintenance/auth";
import { loadContractMaintenanceQuota } from "@/lib/api/maintenance/maintenance-helpers";
import type { MaintenanceFormOptions } from "@/lib/api/maintenance/types";

type RawContractDeviceRow = {
  device_id: string;
  devices: {
    id: string;
    serial_number: string;
    deleted_at: string | null;
    brands: { name: string };
    device_models: { model_name: string };
  };
};

export async function getMaintenanceFormOptions(
  contractId: string,
): Promise<MaintenanceFormOptions> {
  try {
    const ctx = await getMaintenanceApiContext();
    const quota = await loadContractMaintenanceQuota(ctx, contractId);

    const [techniciansRes, devicesRes] = await Promise.all([
      ctx.supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "staff")
        .eq("branch_id", quota.branch_id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("full_name", { ascending: true }),
      ctx.supabase
        .from("contract_devices")
        .select(
          `
          device_id,
          devices!contract_devices_device_id_fkey!inner (
            id,
            serial_number,
            deleted_at,
            brands!devices_brand_id_fkey!inner ( name ),
            device_models!devices_model_id_fkey!inner ( model_name )
          )
        `,
        )
        .eq("contract_id", contractId)
        .is("removed_at", null),
    ]);

    if (techniciansRes.error) {
      throw new Error(techniciansRes.error.message);
    }
    if (devicesRes.error) {
      throw new Error(devicesRes.error.message);
    }

    const devices = ((devicesRes.data ?? []) as unknown as RawContractDeviceRow[])
      .filter((link) => !link.devices.deleted_at)
      .map((link) => {
        const brandName = link.devices.brands.name;
        const modelName = link.devices.device_models.model_name;
        const label = [brandName, modelName, link.devices.serial_number]
          .filter(Boolean)
          .join(" · ");

        return {
          device_id: link.device_id,
          serial_number: link.devices.serial_number,
          brand_name: brandName,
          model_name: modelName,
          label,
        };
      });

    return {
      technicians: techniciansRes.data ?? [],
      devices,
      total_maintenance_count: quota.total_maintenance_count,
      completed_maintenance_count: quota.completed_maintenance_count,
      remaining_maintenance_count: quota.remaining_maintenance_count,
    };
  } catch (error) {
    if (error instanceof MaintenanceApiError) {
      throw error;
    }
    throw new Error(toMaintenanceError(error));
  }
}
