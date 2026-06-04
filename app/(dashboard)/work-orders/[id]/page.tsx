import { notFound } from "next/navigation";

import { WorkOrderDetail } from "@/components/work-orders/WorkOrderDetail";
import { WorkOrderApiError } from "@/lib/api/work-orders/auth";
import { addWorkOrderActivity } from "@/lib/api/work-orders/add-work-order-activity";
import { addWorkOrderPart } from "@/lib/api/work-orders/add-work-order-part";
import { deleteWorkOrder } from "@/lib/api/work-orders/delete-work-order";
import { deleteWorkOrderFile } from "@/lib/api/work-orders/delete-work-order-file";
import { deleteWorkOrderPhoto } from "@/lib/api/work-orders/delete-work-order-photo";
import { getWorkOrderById } from "@/lib/api/work-orders/get-work-order-by-id";
import { getWorkOrderDeletionImpact } from "@/lib/api/work-orders/get-work-order-deletion-impact";
import { getWorkOrderPartOptions } from "@/lib/api/work-orders/get-work-order-part-options";
import { getWorkOrderFileDownloadUrl } from "@/lib/api/work-orders/get-work-order-file-download-url";
import { getWorkOrderPhotoUrl } from "@/lib/api/work-orders/get-work-order-photo-url";
import { removeWorkOrderPart } from "@/lib/api/work-orders/remove-work-order-part";
import { updateWorkOrderStatus } from "@/lib/api/work-orders/update-work-order-status";
import { uploadFile } from "@/lib/api/work-orders/upload-file";
import { uploadPhoto } from "@/lib/api/work-orders/upload-photo";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type WorkOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkOrderDetailPage({
  params,
}: WorkOrderDetailPageProps) {
  const { id } = await params;

  try {
    const user = await getDashboardUser();

    if (!user) {
      notFound();
    }

    const permissions = getPermissions(user);
    const workOrder = await getWorkOrderById(id);

    return (
      <WorkOrderDetail
        workOrder={workOrder}
        currentUserId={user.id}
        isAdmin={permissions.isAdmin}
        canEdit={permissions.canEdit}
        updateStatusAction={updateWorkOrderStatus}
        deleteWorkOrderAction={deleteWorkOrder}
        getDeletionImpactAction={getWorkOrderDeletionImpact}
        uploadFileAction={uploadFile}
        deleteFileAction={deleteWorkOrderFile}
        getFileDownloadUrlAction={getWorkOrderFileDownloadUrl}
        uploadPhotoAction={uploadPhoto}
        deletePhotoAction={deleteWorkOrderPhoto}
        getPhotoUrlAction={getWorkOrderPhotoUrl}
        addNoteAction={addWorkOrderActivity}
        getPartOptionsAction={getWorkOrderPartOptions}
        addPartAction={addWorkOrderPart}
        removePartAction={removeWorkOrderPart}
      />
    );
  } catch (error) {
    if (error instanceof WorkOrderApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
