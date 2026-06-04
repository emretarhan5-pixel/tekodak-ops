import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { CustomerForm } from "@/components/customers/customer-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCustomerFormOptions } from "@/lib/api/customers/get-customer-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

export default async function NewCustomerPage() {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect("/customers");
  }

  try {
    const options = await getCustomerFormOptions();

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href="/customers"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Müşterilere dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Yeni Müşteri Ekle
            </h1>
            <p className="mt-1 text-muted-foreground">
              Kurum bilgilerini girerek yeni müşteri kaydı oluşturun
            </p>
          </div>
        </div>

        <CustomerForm
          mode="create"
          branches={options.branches}
          sectors={options.sectors}
          users={options.users}
          defaultBranchId={user.branch_id}
          lockBranch={permissions.isStaff}
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
            href="/customers"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Müşterilere dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
