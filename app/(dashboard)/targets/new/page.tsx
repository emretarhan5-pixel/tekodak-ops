import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { TargetForm } from "@/components/targets/TargetForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTargetFormOptions } from "@/lib/api/targets/get-target-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

export default async function NewTargetPage() {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect("/targets");
  }

  try {
    const options = await getTargetFormOptions();

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href="/targets"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Hedeflere dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Hedef</h1>
            <p className="mt-1 text-muted-foreground">
              Şube veya personel bazlı performans hedefi tanımlayın
            </p>
          </div>
        </div>

        <TargetForm
          mode="create"
          initialData={null}
          branches={options.branches}
          assignees={options.assignees}
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
            href="/targets"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Hedeflere dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
