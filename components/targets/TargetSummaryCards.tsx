"use client";

import { AlertTriangle, CheckCircle2, Target, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TargetListSummary } from "@/lib/api/targets/types";
import { TARGET_DISPLAY_STATUS_LABELS } from "@/lib/constants/target";

type TargetSummaryCardsProps = {
  summary: TargetListSummary;
};

export function TargetSummaryCards({ summary }: TargetSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Target className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums">
              {summary.totalActive}
            </p>
            <p className="text-sm text-muted-foreground">Toplam Aktif Hedef</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {summary.achievedCount}
              </p>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                {TARGET_DISPLAY_STATUS_LABELS.achieved}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Ulaşılan Hedef</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <TrendingUp className="size-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {summary.inProgressCount}
              </p>
              <Badge className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {TARGET_DISPLAY_STATUS_LABELS.in_progress}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Devam Eden</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <AlertTriangle className="size-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {summary.behindCount}
              </p>
              <Badge className="border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {TARGET_DISPLAY_STATUS_LABELS.behind}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Geride Kalan</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
