import { notFound } from "next/navigation";

import { DeviceDetail } from "@/components/devices/DeviceDetail";
import { DeviceApiError } from "@/lib/api/devices/auth";
import { deleteDevice } from "@/lib/api/devices/delete-device";
import { deleteDeviceFile } from "@/lib/api/devices/delete-device-file";
import { getDeviceById } from "@/lib/api/devices/get-device-by-id";
import { getDeviceDeletionImpact } from "@/lib/api/devices/get-device-deletion-impact";
import { getDeviceFileDownloadUrl } from "@/lib/api/devices/get-device-file-download-url";
import { getDeviceContracts } from "@/lib/api/devices/get-device-contracts";
import { getDeviceFiles } from "@/lib/api/devices/get-device-files";
import { toggleDevicePin } from "@/lib/api/devices/toggle-device-pin";
import { uploadDeviceFile } from "@/lib/api/devices/upload-device-file";
import { getDeviceWorkOrders } from "@/lib/api/work-orders/get-entity-work-orders";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type DeviceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeviceDetailPage({
  params,
}: DeviceDetailPageProps) {
  const { id } = await params;

  try {
    const user = await getDashboardUser();
    const permissions = getPermissions(user);

    if (!user) {
      notFound();
    }

    const [device, contracts, workOrders, files] = await Promise.all([
      getDeviceById(id),
      getDeviceContracts(id),
      getDeviceWorkOrders(id),
      getDeviceFiles(id),
    ]);

    return (
      <DeviceDetail
        device={device}
        contracts={contracts}
        workOrders={workOrders}
        files={files}
        currentUserId={user.id}
        canEdit={permissions.canEdit}
        isAdmin={permissions.isAdmin}
        togglePinAction={toggleDevicePin}
        uploadFileAction={uploadDeviceFile}
        deleteFileAction={deleteDeviceFile}
        getDownloadUrlAction={getDeviceFileDownloadUrl}
        deleteDeviceAction={deleteDevice}
        getDeletionImpactAction={getDeviceDeletionImpact}
      />
    );
  } catch (error) {
    if (error instanceof DeviceApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
