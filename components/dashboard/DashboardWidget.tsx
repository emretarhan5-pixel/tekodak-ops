import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardWidgetProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardWidget({
  title,
  description,
  icon,
  viewAllHref,
  viewAllLabel = "Tümünü Gör",
  children,
  className,
}: DashboardWidgetProps) {
  return (
    <Card className={cn("h-auto shadow-xs", className)}>
      <CardHeader className="space-y-0 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              {icon}
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-xs">{description}</CardDescription>
            ) : null}
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
            >
              {viewAllLabel}
              <ChevronRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

const LIST_PREVIEW_LIMIT = 3;

type DashboardListFooterProps = {
  totalCount: number;
  href: string;
};

export function DashboardListFooter({
  totalCount,
  href,
}: DashboardListFooterProps) {
  const remaining = totalCount - LIST_PREVIEW_LIMIT;
  if (remaining <= 0) return null;

  return (
    <div className="border-t border-border pt-1.5">
      <Link
        href={href}
        className="inline-flex items-center gap-1 py-1.5 text-sm font-medium text-primary hover:underline"
      >
        + {remaining} daha
        <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}

export { LIST_PREVIEW_LIMIT };

type DashboardEmptyStateProps = {
  message: string;
  className?: string;
};

export function DashboardEmptyState({
  message,
  className,
}: DashboardEmptyStateProps) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      {message}
    </p>
  );
}
