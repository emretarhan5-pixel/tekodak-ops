import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Target,
  Wrench,
} from "lucide-react";

export const NOTIFICATION_TYPES = [
  "contract_renewal",
  "critical_stock",
  "work_order_assigned",
  "work_order_completed",
  "contract_new",
  "goal_at_risk",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  contract_renewal: "Sözleşme yenileme",
  critical_stock: "Kritik stok",
  work_order_assigned: "İş emri atandı",
  work_order_completed: "İş emri tamamlandı",
  contract_new: "Yeni sözleşme",
  goal_at_risk: "Hedef uyarısı",
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  contract_renewal: FileText,
  critical_stock: AlertTriangle,
  work_order_assigned: Wrench,
  work_order_completed: CheckCircle2,
  contract_new: ClipboardList,
  goal_at_risk: Target,
};

export const NOTIFICATION_READ_STATUSES = ["all", "unread", "read"] as const;

export type NotificationReadStatus = (typeof NOTIFICATION_READ_STATUSES)[number];

export const NOTIFICATION_READ_STATUS_LABELS: Record<
  NotificationReadStatus,
  string
> = {
  all: "Tümü",
  unread: "Okunmamış",
  read: "Okunmuş",
};

export const NOTIFICATIONS_PAGE_LIMIT = 50;
export const NOTIFICATION_DROPDOWN_LIMIT = 10;
