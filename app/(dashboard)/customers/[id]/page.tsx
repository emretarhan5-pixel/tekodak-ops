import { notFound } from "next/navigation";

import { CustomerDetail } from "@/components/customers/customer-detail";
import { CustomerApiError } from "@/lib/api/customers/auth";
import {
  deleteCustomer,
  getCustomerDeletionImpact,
} from "@/lib/api/customers/delete-customer";
import { deleteCustomerFile } from "@/lib/api/customers/delete-customer-file";
import { getCustomerById } from "@/lib/api/customers/get-customer-by-id";
import { getCustomerFileDownloadUrl } from "@/lib/api/customers/get-customer-file-download-url";
import { getCustomerFiles } from "@/lib/api/customers/get-customer-files";
import { getCustomerContracts } from "@/lib/api/contracts/get-customer-contracts";
import { getCustomerDevices } from "@/lib/api/devices/get-customer-devices";
import { getCustomerWorkOrders } from "@/lib/api/work-orders/get-entity-work-orders";
import { toggleCustomerPin } from "@/lib/api/customers/toggle-customer-pin";
import { uploadCustomerFile } from "@/lib/api/customers/upload-customer-file";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  try {
    const user = await getDashboardUser();
    const permissions = getPermissions(user);

    if (!user) {
      notFound();
    }

    const [customer, devices, contracts, workOrders, files] = await Promise.all([
      getCustomerById(id),
      getCustomerDevices(id),
      getCustomerContracts(id),
      getCustomerWorkOrders(id),
      getCustomerFiles(id),
    ]);

    return (
      <CustomerDetail
        customer={customer}
        devices={devices}
        contracts={contracts}
        workOrders={workOrders}
        files={files}
        currentUserId={user.id}
        isAdmin={permissions.isAdmin}
        canEdit={permissions.canEdit}
        togglePinAction={toggleCustomerPin}
        uploadFileAction={uploadCustomerFile}
        deleteFileAction={deleteCustomerFile}
        getDownloadUrlAction={getCustomerFileDownloadUrl}
        deleteCustomerAction={deleteCustomer}
        getDeletionImpactAction={getCustomerDeletionImpact}
      />
    );
  } catch (error) {
    if (error instanceof CustomerApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
