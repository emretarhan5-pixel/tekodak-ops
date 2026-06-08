import { Badge } from "@/components/ui/badge";
import {
  MAINTENANCE_PLAN_STATUS_LABELS,
  type MaintenancePlanStatus,
  type MaintenancePlanStatusBadgeVariant,
} from "@/lib/constants/maintenance";
import { cn } from "@/lib/utils";

const VARIANT_UI: Record<
  MaintenancePlanStatusBadgeVariant,
  { dotClassName: string; className: string }
> = {
  info: {
    dotClassName: "bg-blue-500",
    className:
      "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  warning: {
    dotClassName: "bg-amber-500",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  success: {
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  muted: {
    dotClassName: "bg-muted-foreground/50",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function MaintenanceStatusBadge({
  status,
  variant,
  className,
}: {
  status: MaintenancePlanStatus;
  variant: MaintenancePlanStatusBadgeVariant;
  className?: string;
}) {
  const config = VARIANT_UI[variant];

  return (
    <Badge className={cn("gap-1.5 font-normal", config.className, className)}>
      <span
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full", config.dotClassName)}
      />
      {MAINTENANCE_PLAN_STATUS_LABELS[status]}
    </Badge>
  );
}
