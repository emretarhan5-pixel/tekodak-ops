import { getStockStatusLabel } from "@/lib/api/stock/stock-status";
import { Badge } from "@/components/ui/badge";
import type { StockStatusBadgeVariant } from "@/lib/constants/stock-item";
import type { StockStatus } from "@/lib/constants/stock-item";
import { cn } from "@/lib/utils";

const VARIANT_UI: Record<
  StockStatusBadgeVariant,
  { dotClassName: string; className: string }
> = {
  success: {
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  warning: {
    dotClassName: "bg-amber-500",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  destructive: {
    dotClassName: "bg-red-500",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  },
  secondary: {
    dotClassName: "bg-muted-foreground/50",
    className: "border-border bg-muted text-muted-foreground",
  },
  outline: {
    dotClassName: "bg-blue-500",
    className:
      "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
};

export function StockStatusBadge({
  status,
  variant,
  currentQuantity,
  className,
}: {
  status: StockStatus;
  variant: StockStatusBadgeVariant;
  currentQuantity: number;
  className?: string;
}) {
  const config = VARIANT_UI[variant];
  const label = getStockStatusLabel(status, currentQuantity);

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
