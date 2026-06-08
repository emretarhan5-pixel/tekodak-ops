"use server";

import {
  assertCanCreateMaintenancePlan,
  getMaintenanceApiContext,
  toMaintenanceError,
} from "@/lib/api/maintenance/auth";
import {
  emptyToNull,
  loadContractMaintenanceQuota,
  validateAssignedTechnician,
  validateContractDevices,
} from "@/lib/api/maintenance/maintenance-helpers";
import { revalidateMaintenancePaths } from "@/lib/api/maintenance/maintenance-revalidate-paths";
import type { ActionResult } from "@/lib/api/maintenance/types";
import type { TablesInsert } from "@/lib/supabase/types";
import {
  createMaintenancePlanSchema,
  type CreateMaintenancePlanInput,
} from "@/schemas/maintenance";

export async function createMaintenancePlan(
  rawInput: CreateMaintenancePlanInput,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const input = createMaintenancePlanSchema.parse(rawInput);
    const ctx = await getMaintenanceApiContext();

    const quota = await loadContractMaintenanceQuota(ctx, input.contract_id);

    if (quota.remaining_maintenance_count <= 0) {
      return {
        success: false,
        error: "Sözleşmede kalan bakım hakkı bulunmuyor",
      };
    }

    assertCanCreateMaintenancePlan(ctx, {
      branchId: quota.branch_id,
      assignedTechnicianId: input.assigned_technician_id,
    });

    await validateAssignedTechnician(
      ctx,
      input.assigned_technician_id,
      quota.branch_id,
    );

    const devices = await validateContractDevices(
      ctx,
      input.contract_id,
      input.device_ids,
    );

    const planRow: TablesInsert<"periodic_maintenance_plans"> = {
      contract_id: input.contract_id,
      branch_id: quota.branch_id,
      planned_date: input.planned_date,
      assigned_technician_id: input.assigned_technician_id,
      status: "planned",
      notes: emptyToNull(input.notes),
      created_by: ctx.user.id,
    };

    const { data: plan, error: planError } = await ctx.supabase
      .from("periodic_maintenance_plans")
      .insert(planRow)
      .select("id")
      .single();

    if (planError || !plan) {
      throw new Error(planError?.message ?? "Bakım planı oluşturulamadı");
    }

    const deviceRows: TablesInsert<"periodic_maintenance_devices">[] =
      devices.map((device) => ({
        maintenance_plan_id: plan.id,
        device_id: device.device_id,
        serial_number: device.serial_number,
      }));

    const { error: devicesError } = await ctx.supabase
      .from("periodic_maintenance_devices")
      .insert(deviceRows);

    if (devicesError) {
      await ctx.supabase
        .from("periodic_maintenance_plans")
        .delete()
        .eq("id", plan.id);
      throw new Error(devicesError.message);
    }

    revalidateMaintenancePaths(plan.id, input.contract_id);

    return { success: true, data: { planId: plan.id } };
  } catch (error) {
    return { success: false, error: toMaintenanceError(error) };
  }
}
