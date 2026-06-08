import { Skeleton } from "@/components/ui/skeleton";

function StepperSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton
          key={`step-skeleton-${index + 1}`}
          className="h-20 flex-1 rounded-lg sm:h-24"
        />
      ))}
    </div>
  );
}

export default function ServiceRequestDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-44" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-48" />
      </div>
      <StepperSkeleton />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
