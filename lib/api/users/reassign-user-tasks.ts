"use server";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import {
  USER_OPEN_MAINTENANCE_PLAN_STATUSES,
  USER_OPEN_SERVICE_REQUEST_STATUSES,
} from "@/lib/api/users/open-task-filters";
import type { ActionResult, ReassignUserTasksResult } from "@/lib/api/users/types";
import { USER_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";

export async function reassignUserTasks(
  fromUserId: string,
  toTechnicianId: string,
): Promise<ActionResult<ReassignUserTasksResult>> {
  try {
    await getAdminUserContext();
    const supabase = await createClient();

    if (fromUserId === toTechnicianId) {
      return {
        success: false,
        error: "Görevler aynı kullanıcıya yönlendirilemez",
      };
    }

    const { data: technician, error: technicianError } = await supabase
      .from("users")
      .select("id, role, is_active")
      .eq("id", toTechnicianId)
      .is("deleted_at", null)
      .maybeSingle();

    if (technicianError) {
      throw new Error(technicianError.message);
    }

    if (!technician || !technician.is_active) {
      return { success: false, error: "Seçilen teknisyen bulunamadı veya aktif değil" };
    }

    if (technician.role !== USER_ROLES.STAFF) {
      return {
        success: false,
        error: "Görevler yalnızca aktif personele yönlendirilebilir",
      };
    }

    const now = new Date().toISOString();

    const [serviceRequestsResult, maintenancePlansResult] = await Promise.all([
      supabase
        .from("service_requests")
        .update({
          assigned_technician_id: toTechnicianId,
          updated_at: now,
        })
        .eq("assigned_technician_id", fromUserId)
        .in("status", [...USER_OPEN_SERVICE_REQUEST_STATUSES])
        .is("deleted_at", null)
        .select("id"),
      supabase
        .from("periodic_maintenance_plans")
        .update({
          assigned_technician_id: toTechnicianId,
          updated_at: now,
        })
        .eq("assigned_technician_id", fromUserId)
        .in("status", [...USER_OPEN_MAINTENANCE_PLAN_STATUSES])
        .is("deleted_at", null)
        .select("id"),
    ]);

    if (serviceRequestsResult.error) {
      throw new Error(serviceRequestsResult.error.message);
    }
    if (maintenancePlansResult.error) {
      throw new Error(maintenancePlansResult.error.message);
    }

    return {
      success: true,
      data: {
        reassignedServiceRequests: serviceRequestsResult.data?.length ?? 0,
        reassignedMaintenancePlans: maintenancePlansResult.data?.length ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
