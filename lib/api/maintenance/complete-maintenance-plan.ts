"use server";

import { redirect } from "next/navigation";

import {
  assertCanEditMaintenancePlan,
  getMaintenanceApiContext,
  toMaintenanceError,
} from "@/lib/api/maintenance/auth";
import {
  assertMaintenancePlanStatus,
  loadMaintenancePlanRow,
} from "@/lib/api/maintenance/maintenance-helpers";
import { revalidateMaintenancePaths } from "@/lib/api/maintenance/maintenance-revalidate-paths";
import type { ActionResult } from "@/lib/api/maintenance/types";
import {
  completeMaintenancePlanSchema,
  type CompleteMaintenancePlanInput,
} from "@/schemas/maintenance";

export async function completeMaintenancePlan(
  rawInput: CompleteMaintenancePlanInput,
): Promise<ActionResult<{ planId: string; contractId: string }>> {
  let contractId: string;
  let planId: string;

  try {
    const input = completeMaintenancePlanSchema.parse(rawInput);
    const ctx = await getMaintenanceApiContext();

    const row = await loadMaintenancePlanRow(ctx, input.plan_id);
    assertCanEditMaintenancePlan(ctx, row);
    assertMaintenancePlanStatus(row, ["in_progress"]);

    planId = input.plan_id;
    contractId = row.contract_id;

    const { data: devices, error: devicesError } = await ctx.supabase
      .from("periodic_maintenance_devices")
      .select("id, is_completed")
      .eq("maintenance_plan_id", planId);

    if (devicesError) {
      throw new Error(devicesError.message);
    }

    if (!devices?.length) {
      return {
        success: false,
        error: "Bakım planında en az bir cihaz olmalıdır",
      };
    }

    const incomplete = devices.filter((device) => !device.is_completed);
    if (incomplete.length > 0) {
      return {
        success: false,
        error: `Tüm cihazlar tamamlanmadan bakım kapatılamaz (${incomplete.length} kalan)`,
      };
    }

    const { error: updateError } = await ctx.supabase
      .from("periodic_maintenance_plans")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidateMaintenancePaths(planId, contractId);
  } catch (error) {
    return { success: false, error: toMaintenanceError(error) };
  }

  redirect(`/contracts/${contractId}?tab=maintenance`);
}
