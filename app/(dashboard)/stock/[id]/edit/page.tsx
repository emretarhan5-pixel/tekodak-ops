import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { StockItemForm } from "@/components/stock/StockItemForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { stockDetailHref } from "@/components/stock/stock-utils";
import { StockApiError } from "@/lib/api/stock/auth";
import { getStockFormOptions } from "@/lib/api/stock/get-stock-form-options";
import { getStockItemById } from "@/lib/api/stock/get-stock-item-by-id";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type EditStockItemPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function EditStockItemPage({
  params,
  searchParams,
}: EditStockItemPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const branchId = pickString(resolvedSearchParams, "branchId");

  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect(stockDetailHref(id, branchId ?? ""));
  }

  try {
    const [item, options] = await Promise.all([
      getStockItemById(id, branchId),
      getStockFormOptions(),
    ]);

    const detailHref = stockDetailHref(item.part_id, item.branch.branch_id);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href={detailHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Stok detayına dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stok Düzenle</h1>
            <p className="mt-1 font-mono text-muted-foreground">
              {item.part_code} · {item.description}
            </p>
          </div>
        </div>

        <StockItemForm
          mode="edit"
          initialData={item}
          categories={options.categories}
          brands={options.brands}
          branches={options.branches}
          defaultBranchId={item.branch.branch_id}
          showBranchSelect={false}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof StockApiError && error.code === "NOT_FOUND") {
      notFound();
    }

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
