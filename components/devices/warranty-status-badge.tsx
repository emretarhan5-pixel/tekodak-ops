import type { WarrantyBadge } from "@/lib/api/devices/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WARRANTY_UI: Record<
  WarrantyBadge,
  { label: string; dotClassName: string; className: string }
> = {
  active: {
    label: "Sürüyor",
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  warning_90: {
    label: "≤90 gün",
    dotClassName: "bg-amber-500",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  critical_30: {
    label: "≤30 gün",
    dotClassName: "bg-red-500",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  },
  expired: {
    label: "Bitti",
    dotClassName: "bg-muted-foreground/50",
    className:
      "border-border bg-muted text-muted-foreground",
  },
};

export function WarrantyStatusBadge({
  badge,
  className,
}: {
  badge: WarrantyBadge;
  className?: string;
}) {
  const config = WARRANTY_UI[badge];

  return (
    <Badge className={cn("gap-1.5 font-normal", config.className, className)}>
      <span
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full", config.dotClassName)}
      />
      {config.label}
    </Badge>
  );
}
