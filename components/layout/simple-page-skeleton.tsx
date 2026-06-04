import { Skeleton } from "@/components/ui/skeleton";

type SimplePageSkeletonProps = {
  titleWidth?: string;
};

export function SimplePageSkeleton({
  titleWidth = "w-48",
}: SimplePageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className={`h-9 ${titleWidth}`} />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
