import { Card, CardContent } from "@/components/ui/card";

export function TargetListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-44 animate-pulse rounded-xl border border-border bg-muted/30" />
      <Card>
        <CardContent className="p-0">
          <div className="h-96 animate-pulse bg-muted/20" />
        </CardContent>
      </Card>
    </div>
  );
}
