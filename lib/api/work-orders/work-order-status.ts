import {
  TERMINAL_WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_VARIANTS,
  type WorkOrderStatus,
} from "@/lib/constants/work-order";

export function isTerminalWorkOrderStatus(status: WorkOrderStatus): boolean {
  return (TERMINAL_WORK_ORDER_STATUSES as readonly string[]).includes(status);
}

export type WorkOrderStatusBadgeVariant =
  (typeof WORK_ORDER_STATUS_VARIANTS)[WorkOrderStatus];

export function getWorkOrderStatusLabel(status: WorkOrderStatus): string {
  return WORK_ORDER_STATUS_LABELS[status];
}

export function getWorkOrderStatusVariant(
  status: WorkOrderStatus,
): WorkOrderStatusBadgeVariant {
  return WORK_ORDER_STATUS_VARIANTS[status];
}

/** Liste filtreleri için basitleştirilmiş durum grubu etiketi. */
export function getWorkOrderStatusGroupLabel(status: WorkOrderStatus): string {
  switch (status) {
    case "new":
    case "assigned":
      return "Yeni";
    case "in_progress":
      return "Devam Ediyor";
    case "completed":
      return "Tamamlandı";
    case "cancelled":
    case "on_hold":
      return status === "on_hold" ? "Beklemede" : "İptal";
    default:
      return getWorkOrderStatusLabel(status);
  }
}
