import { SimplePageSkeleton } from "@/components/layout/simple-page-skeleton";

export default function NewServiceRequestLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <SimplePageSkeleton titleWidth="w-56" />
    </div>
  );
}
