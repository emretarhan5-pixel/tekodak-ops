"use server";

import {
  assertCanEditMaintenancePlan,
  getMaintenanceApiContext,
  MaintenanceApiError,
  toMaintenanceError,
} from "@/lib/api/maintenance/auth";
import {
  assertMaintenancePlanStatus,
  emptyToNull,
  loadMaintenancePlanRow,
} from "@/lib/api/maintenance/maintenance-helpers";
import { revalidateMaintenancePaths } from "@/lib/api/maintenance/maintenance-revalidate-paths";
import type { ActionResult } from "@/lib/api/maintenance/types";
import {
  updateMaintenanceDeviceSchema,
  type UpdateMaintenanceDeviceInput,
} from "@/schemas/maintenance";

export async function updateMaintenanceDevice(
  rawInput: UpdateMaintenanceDeviceInput,
): Promise<ActionResult<{ deviceRowId: string }>> {
  try {
    const input = updateMaintenanceDeviceSchema.parse(rawInput);
    const ctx = await getMaintenanceApiContext();

    const { data: deviceRow, error: deviceError } = await ctx.supabase
      .from("periodic_maintenance_devices")
      .select("id, maintenance_plan_id")
      .eq("id", input.device_row_id)
      .maybeSingle();

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    if (!deviceRow) {
      throw new MaintenanceApiError("Bakım cihaz kaydı bulunamadı", "NOT_FOUND");
    }

    const plan = await loadMaintenancePlanRow(ctx, deviceRow.maintenance_plan_id);
    assertCanEditMaintenancePlan(ctx, plan);
    assertMaintenancePlanStatus(plan, ["in_progress"]);

    const { error: updateError } = await ctx.supabase
      .from("periodic_maintenance_devices")
      .update({
        work_notes: emptyToNull(input.work_notes),
        is_completed: input.is_completed,
      })
      .eq("id", input.device_row_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidateMaintenancePaths(plan.id, plan.contract_id);

    return { success: true, data: { deviceRowId: input.device_row_id } };
  } catch (error) {
    return { success: false, error: toMaintenanceError(error) };
  }
}
