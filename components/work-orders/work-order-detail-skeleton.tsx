import { Skeleton } from "@/components/ui/skeleton";

export function WorkOrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="sticky top-0 z-10 space-y-4 border-b border-border bg-background/95 pb-4 backdrop-blur">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
