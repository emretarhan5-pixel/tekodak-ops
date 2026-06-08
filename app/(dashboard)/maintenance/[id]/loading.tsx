import { Skeleton } from "@/components/ui/skeleton";

export default function MaintenanceDetailLoading() {
  return (
    <div className="space-y-4 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-36" />
      <div className="space-y-3">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    </div>
  );
}
