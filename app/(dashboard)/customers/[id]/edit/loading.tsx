import { Skeleton } from "@/components/ui/skeleton";

export default function EditCustomerLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-11 w-full max-w-xs rounded-lg" />
    </div>
  );
}
