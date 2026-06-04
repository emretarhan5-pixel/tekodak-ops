import { Skeleton } from "@/components/ui/skeleton";

export default function DeviceDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
