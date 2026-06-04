import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { StockCategoriesEmptyState } from "@/components/stock/stock-categories-empty-state";
import { StockItemForm } from "@/components/stock/StockItemForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStockFormOptions } from "@/lib/api/stock/get-stock-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

export default async function NewStockItemPage() {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect("/stock");
  }

  try {
    const options = await getStockFormOptions();

    if (options.categories.length === 0) {
      return (
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-4">
            <Link
              href="/stock"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 px-0",
              )}
            >
              <ChevronLeft className="size-4" />
              Stok listesine dön
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yeni Ürün</h1>
              <p className="mt-1 text-muted-foreground">
                Stok envanterine yeni parça ekleyin
              </p>
            </div>
          </div>
          <StockCategoriesEmptyState />
        </div>
      );
    }

    if (options.branches.length === 0) {
      return (
        <Card className="border-destructive/40">
          <CardContent className="py-10 text-center">
            <h1 className="text-lg font-semibold text-destructive">
              Şube bulunamadı
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ürün eklemek için aktif bir şube tanımlı olmalıdır.
            </p>
            <Link
              href="/stock"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Stok listesine dön
            </Link>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href="/stock"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Stok listesine dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Ürün</h1>
            <p className="mt-1 text-muted-foreground">
              Şube bazlı stok kartı oluşturun
            </p>
          </div>
        </div>

        <StockItemForm
          mode="create"
          initialData={null}
          categories={options.categories}
          brands={options.brands}
          branches={options.branches}
          defaultBranchId={options.defaultBranchId}
          showBranchSelect={permissions.isAdmin}
        />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Form verileri yüklenirken bir hata oluştu.";

    return (
      <Card className="border-destructive/40">
        <CardContent className="py-10 text-center">
          <h1 className="text-lg font-semibold text-destructive">
            Sayfa yüklenemedi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link
            href="/stock"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Stok listesine dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
