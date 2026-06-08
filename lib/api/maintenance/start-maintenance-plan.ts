"use server";

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
  startMaintenancePlanSchema,
  type StartMaintenancePlanInput,
} from "@/schemas/maintenance";

export async function startMaintenancePlan(
  rawInput: StartMaintenancePlanInput,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const input = startMaintenancePlanSchema.parse(rawInput);
    const ctx = await getMaintenanceApiContext();

    const row = await loadMaintenancePlanRow(ctx, input.plan_id);
    assertCanEditMaintenancePlan(ctx, row);
    assertMaintenancePlanStatus(row, ["planned"]);

    const { error } = await ctx.supabase
      .from("periodic_maintenance_plans")
      .update({ status: "in_progress" })
      .eq("id", input.plan_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateMaintenancePaths(input.plan_id, row.contract_id);

    return { success: true, data: { planId: input.plan_id } };
  } catch (error) {
    return { success: false, error: toMaintenanceError(error) };
  }
}
