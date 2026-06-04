import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <Card className={cn("flex h-full flex-col shadow-xs", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
            >
              {viewAllLabel}
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

type DashboardEmptyStateProps = {
  message: string;
  className?: string;
};

export function DashboardEmptyState({
  message,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}
