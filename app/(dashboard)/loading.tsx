import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
      aria-label="Yükleniyor"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
