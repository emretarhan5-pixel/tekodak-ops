import { notFound } from "next/navigation";

import { ServiceRequestDetail } from "@/components/service-requests/ServiceRequestDetail";
import { ServiceRequestApiError } from "@/lib/api/service-requests/auth";
import { addServiceRequestPart } from "@/lib/api/service-requests/add-service-request-part";
import { deleteServiceRequestPhoto } from "@/lib/api/service-requests/delete-service-request-photo";
import { getServiceRequestById } from "@/lib/api/service-requests/get-service-request-by-id";
import { getServiceRequestPartOptions } from "@/lib/api/service-requests/get-service-request-part-options";
import { getServiceRequestPhotoUrl } from "@/lib/api/service-requests/get-service-request-photo-url";
import { removeServiceRequestPart } from "@/lib/api/service-requests/remove-service-request-part";
import { uploadServiceRequestPhoto } from "@/lib/api/service-requests/upload-service-request-photo";

type ServiceRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ServiceRequestDetailPage({
  params,
}: ServiceRequestDetailPageProps) {
  const { id } = await params;

  try {
    const serviceRequest = await getServiceRequestById(id);

    return (
      <ServiceRequestDetail
        serviceRequest={serviceRequest}
        uploadPhotoAction={uploadServiceRequestPhoto}
        deletePhotoAction={deleteServiceRequestPhoto}
        getPhotoUrlAction={getServiceRequestPhotoUrl}
        getPartOptionsAction={getServiceRequestPartOptions}
        addPartAction={addServiceRequestPart}
        removePartAction={removeServiceRequestPart}
      />
    );
  } catch (error) {
    if (error instanceof ServiceRequestApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
