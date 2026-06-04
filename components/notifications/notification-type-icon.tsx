import { Bell } from "lucide-react";

import {
  NOTIFICATION_TYPE_ICONS,
  type NotificationType,
} from "@/lib/constants/notifications";
import { cn } from "@/lib/utils";

type NotificationTypeIconProps = {
  type: string;
  className?: string;
};

export function NotificationTypeIcon({
  type,
  className,
}: NotificationTypeIconProps) {
  const Icon =
    type in NOTIFICATION_TYPE_ICONS
      ? NOTIFICATION_TYPE_ICONS[type as NotificationType]
      : Bell;

  const toneClass =
    type === "contract_renewal" || type === "critical_stock"
      ? "text-destructive"
      : type === "work_order_completed" || type === "contract_new"
        ? "text-emerald-600 dark:text-emerald-500"
        : "text-primary";

  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
        className,
      )}
    >
      <Icon className={cn("size-4", toneClass)} aria-hidden />
    </span>
  );
}
