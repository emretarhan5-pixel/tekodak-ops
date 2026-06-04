import { Package, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StockEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Package className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Henüz stok kaydı yok</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Şube bazlı parça ve malzeme stoklarını buradan takip edebilirsiniz.
            İlk ürünü ekleyerek başlayın.
          </p>
        </div>
        <Link href="/stock/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" />
          Yeni Ürün
        </Link>
      </CardContent>
    </Card>
  );
}
