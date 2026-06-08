import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MaintenanceDetail } from "@/components/maintenance/MaintenanceDetail";
import { MaintenanceApiError } from "@/lib/api/maintenance/auth";
import { completeMaintenancePlan } from "@/lib/api/maintenance/complete-maintenance-plan";
import { getMaintenanceById } from "@/lib/api/maintenance/get-maintenance-by-id";
import { startMaintenancePlan } from "@/lib/api/maintenance/start-maintenance-plan";
import { updateMaintenanceDevice } from "@/lib/api/maintenance/update-maintenance-device";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { pageMetadata } from "@/lib/metadata/site";
import { getPermissions } from "@/lib/utils/permissions";

type MaintenanceDetailPageProps = {
  params: Promise<{ id: string }>;
};

const getMaintenanceCached = cache(getMaintenanceById);

export async function generateMetadata({
  params,
}: MaintenanceDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const plan = await getMaintenanceCached(id);
    return pageMetadata(
      `Bakım Planı — ${plan.contract_number}`,
      `${plan.customer_name} — periyodik bakım planı`,
    );
  } catch (error) {
    if (error instanceof MaintenanceApiError && error.code === "NOT_FOUND") {
      return pageMetadata("Bakım Planı Bulunamadı");
    }
    return pageMetadata("Periyodik Bakım");
  }
}

export default async function MaintenanceDetailPage({
  params,
}: MaintenanceDetailPageProps) {
  const { id } = await params;

  try {
    const [user, plan] = await Promise.all([
      getDashboardUser(),
      getMaintenanceCached(id),
    ]);

    if (!user) {
      notFound();
    }

    const permissions = getPermissions(user);
    const canEditPlan =
      permissions.canEdit &&
      (permissions.isAdmin || plan.assigned_technician_id === user.id) &&
      (plan.status === "planned" || plan.status === "in_progress");

    return (
      <MaintenanceDetail
        plan={plan}
        canEditPlan={canEditPlan}
        startMaintenancePlanAction={startMaintenancePlan}
        updateMaintenanceDeviceAction={updateMaintenanceDevice}
        completeMaintenancePlanAction={completeMaintenancePlan}
      />
    );
  } catch (error) {
    if (error instanceof MaintenanceApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
