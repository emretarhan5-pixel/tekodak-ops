import { Skeleton } from "@/components/ui/skeleton";

export default function NewStockItemLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
