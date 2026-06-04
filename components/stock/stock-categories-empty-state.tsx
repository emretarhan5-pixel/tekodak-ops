import { FolderOpen } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StockCategoriesEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Stok kategorisi tanımlı değil</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Yeni ürün ekleyebilmek için en az bir parça kategorisi gereklidir.
            Kategori yönetimi ileride Ayarlar bölümünden yapılacaktır; şimdilik
            veritabanına kategori kaydı eklenmesi gerekir.
          </p>
        </div>
        <Link
          href="/stock"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Stok listesine dön
        </Link>
      </CardContent>
    </Card>
  );
}
