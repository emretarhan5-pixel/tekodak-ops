import { notFound } from "next/navigation";

import { ContractDetail } from "@/components/contracts/ContractDetail";
import { ContractApiError } from "@/lib/api/contracts/auth";
import { deleteContract } from "@/lib/api/contracts/delete-contract";
import { deleteContractFile } from "@/lib/api/contracts/delete-contract-file";
import { getContractById } from "@/lib/api/contracts/get-contract-by-id";
import { getContractDeletionImpact } from "@/lib/api/contracts/get-contract-deletion-impact";
import { getContractFileDownloadUrl } from "@/lib/api/contracts/get-contract-file-download-url";
import { getContractFiles } from "@/lib/api/contracts/get-contract-files";
import { uploadContractFile } from "@/lib/api/contracts/upload-contract-file";
import { getContractWorkOrders } from "@/lib/api/work-orders/get-entity-work-orders";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type ContractDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;

  try {
    const user = await getDashboardUser();
    const permissions = getPermissions(user);

    if (!user) {
      notFound();
    }

    const [contract, workOrders, files] = await Promise.all([
      getContractById(id),
      getContractWorkOrders(id),
      getContractFiles(id),
    ]);

    return (
      <ContractDetail
        contract={contract}
        workOrders={workOrders}
        files={files}
        currentUserId={user.id}
        isAdmin={permissions.isAdmin}
        canEdit={permissions.canEdit}
        uploadFileAction={uploadContractFile}
        deleteFileAction={deleteContractFile}
        getDownloadUrlAction={getContractFileDownloadUrl}
        deleteContractAction={deleteContract}
        getDeletionImpactAction={getContractDeletionImpact}
      />
    );
  } catch (error) {
    if (error instanceof ContractApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
