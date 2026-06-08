import {
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_STATUS_VARIANTS,
  TERMINAL_SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus,
  type ServiceRequestStep,
} from "@/lib/constants/service-request";

export type ServiceRequestStatusBadgeVariant =
  (typeof SERVICE_REQUEST_STATUS_VARIANTS)[ServiceRequestStatus];

export function isTerminalServiceRequestStatus(
  status: ServiceRequestStatus,
): boolean {
  return (TERMINAL_SERVICE_REQUEST_STATUSES as readonly string[]).includes(
    status,
  );
}

export function getServiceRequestStatusLabel(status: ServiceRequestStatus): string {
  return SERVICE_REQUEST_STATUS_LABELS[status];
}

export function getServiceRequestStatusVariant(
  status: ServiceRequestStatus,
): ServiceRequestStatusBadgeVariant {
  return SERVICE_REQUEST_STATUS_VARIANTS[status];
}

export function getStepForStatus(status: ServiceRequestStatus): ServiceRequestStep {
  switch (status) {
    case "draft":
      return 1;
    case "ariza_tespit":
      return 2;
    case "teklif_hazir":
      return 3;
    case "teklif_onaylandi":
      return 4;
    case "bakim_yapiliyor":
    case "tamamlandi":
      return 5;
    case "rejected":
      return 3;
    default:
      return 1;
  }
}

export function getActiveEditStep(status: ServiceRequestStatus): ServiceRequestStep | null {
  if (isTerminalServiceRequestStatus(status)) {
    return null;
  }

  switch (status) {
    case "draft":
      return 1;
    case "ariza_tespit":
      return 2;
    case "teklif_hazir":
      return 3;
    case "teklif_onaylandi":
      return 4;
    case "bakim_yapiliyor":
      return 5;
    default:
      return null;
  }
}
