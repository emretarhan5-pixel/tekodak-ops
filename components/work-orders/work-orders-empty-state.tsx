import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WorkOrdersEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Henüz iş emri yok</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Bakım, onarım ve kurulum işlerini buradan takip edebilirsiniz. İlk
            kaydı oluşturmak için yeni iş emri ekleyin.
          </p>
        </div>
        <Link
          href="/work-orders/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="size-4" />
          Yeni İş Emri
        </Link>
      </CardContent>
    </Card>
  );
}
