import type { ContractRenewalBadge } from "@/lib/constants/contract";
import { CONTRACT_STATUS_LABELS } from "@/lib/constants/contract";
import type { ContractStatus } from "@/lib/constants/contract";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const RENEWAL_UI: Record<
  ContractRenewalBadge,
  { dotClassName: string; className: string }
> = {
  active: {
    dotClassName: "bg-emerald-500",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  warning_90: {
    dotClassName: "bg-amber-500",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  critical_30: {
    dotClassName: "bg-red-500",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  },
  ended: {
    dotClassName: "bg-muted-foreground/50",
    className: "border-border bg-muted text-muted-foreground",
  },
};

type ContractRenewalBadgeProps = {
  renewalBadge: ContractRenewalBadge;
  status: ContractStatus;
  className?: string;
};

export function ContractRenewalBadgeDisplay({
  renewalBadge,
  status,
  className,
}: ContractRenewalBadgeProps) {
  const config = RENEWAL_UI[renewalBadge];
  const label = CONTRACT_STATUS_LABELS[status];

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
