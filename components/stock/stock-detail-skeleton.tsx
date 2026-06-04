import { Skeleton } from "@/components/ui/skeleton";

export function StockDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-4 rounded-xl border border-border p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
