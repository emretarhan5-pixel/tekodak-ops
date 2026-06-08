import { Plus, Wrench } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ServiceRequestsEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Wrench className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Henüz servis talebi yok</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Müşteri cihaz kayıtları, arıza tespiti ve teklif sürecini buradan
            yönetebilirsiniz. İlk talebi oluşturmak için yeni kayıt açın.
          </p>
        </div>
        <Link
          href="/service-requests/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="size-4" />
          Yeni Servis Talebi
        </Link>
      </CardContent>
    </Card>
  );
}
