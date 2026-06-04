import { notFound } from "next/navigation";

import { TargetDetail } from "@/components/targets/TargetDetail";
import { TargetApiError } from "@/lib/api/targets/auth";
import { cancelTarget } from "@/lib/api/targets/cancel-target";
import { deleteTarget } from "@/lib/api/targets/delete-target";
import { getTargetById } from "@/lib/api/targets/get-target-by-id";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type TargetDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TargetDetailPage({
  params,
}: TargetDetailPageProps) {
  const { id } = await params;

  try {
    const user = await getDashboardUser();

    if (!user) {
      notFound();
    }

    const permissions = getPermissions(user);
    const target = await getTargetById(id);

    return (
      <TargetDetail
        target={target}
        canEdit={permissions.canEdit}
        cancelTargetAction={cancelTarget}
        deleteTargetAction={deleteTarget}
      />
    );
  } catch (error) {
    if (error instanceof TargetApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
