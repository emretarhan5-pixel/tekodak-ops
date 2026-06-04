import type { TargetDisplayStatus } from "@/lib/constants/target";
import { getProgressBarColorClass } from "@/lib/api/targets/target-progress-display";
import { cn } from "@/lib/utils";

type TargetProgressBarProps = {
  percentage: number;
  displayStatus: TargetDisplayStatus;
  className?: string;
};

export function TargetProgressBar({
  percentage,
  displayStatus,
  className,
}: TargetProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={cn("flex min-w-[7rem] items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            getProgressBarColorClass(displayStatus),
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
        {new Intl.NumberFormat("tr-TR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(percentage)}
        %
      </span>
    </div>
  );
}
