"use server";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  USER_OPEN_MAINTENANCE_PLAN_STATUSES,
  USER_OPEN_SERVICE_REQUEST_STATUSES,
} from "@/lib/api/users/open-task-filters";
import type { UserOpenTasks } from "@/lib/api/users/types";
import { createClient } from "@/lib/supabase/server";

export async function getUserOpenTasks(
  userId: string,
): Promise<UserOpenTasks> {
  await getAdminUserContext();
  const supabase = await createClient();

  const [serviceRequestsResult, maintenancePlansResult] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_technician_id", userId)
      .in("status", [...USER_OPEN_SERVICE_REQUEST_STATUSES])
      .is("deleted_at", null),
    supabase
      .from("periodic_maintenance_plans")
      .select("id", { count: "exact", head: true })
      .eq("assigned_technician_id", userId)
      .in("status", [...USER_OPEN_MAINTENANCE_PLAN_STATUSES])
      .is("deleted_at", null),
  ]);

  if (serviceRequestsResult.error) {
    throw new Error(serviceRequestsResult.error.message);
  }
  if (maintenancePlansResult.error) {
    throw new Error(maintenancePlansResult.error.message);
  }

  return {
    openServiceRequests: serviceRequestsResult.count ?? 0,
    openMaintenancePlans: maintenancePlansResult.count ?? 0,
  };
}
