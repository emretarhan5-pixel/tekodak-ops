import type { TargetDisplayStatus } from "@/lib/constants/target";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DISPLAY_STATUS_UI: Record<
  TargetDisplayStatus,
  { dotClassName: string; className: string }
> = {
  achieved: {
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  in_progress: {
    dotClassName: "bg-amber-500",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  behind: {
    dotClassName: "bg-red-500",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  },
  inactive: {
    dotClassName: "bg-muted-foreground/50",
    className: "border-border bg-muted text-muted-foreground",
  },
};

type TargetDisplayStatusBadgeProps = {
  displayStatus: TargetDisplayStatus;
  label: string;
  className?: string;
};

export function TargetDisplayStatusBadge({
  displayStatus,
  label,
  className,
}: TargetDisplayStatusBadgeProps) {
  const config = DISPLAY_STATUS_UI[displayStatus];

  return (
    <Badge className={cn("gap-1.5 font-normal", config.className, className)}>
      <span
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full", config.dotClassName)}
      />
      {label}
    </Badge>
  );
}
