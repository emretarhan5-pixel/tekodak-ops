import { Skeleton } from "@/components/ui/skeleton";

export function TargetDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-96 max-w-full" />
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="rounded-xl border border-border p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-10 w-64" />
        <Skeleton className="mt-4 h-4 w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
