import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { TargetForm } from "@/components/targets/TargetForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TargetApiError } from "@/lib/api/targets/auth";
import { getTargetById } from "@/lib/api/targets/get-target-by-id";
import { getTargetFormOptions } from "@/lib/api/targets/get-target-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type EditTargetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTargetPage({ params }: EditTargetPageProps) {
  const { id } = await params;
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect(`/targets/${id}`);
  }

  try {
    const target = await getTargetById(id);

    if (target.status === "cancelled") {
      redirect(`/targets/${id}`);
    }

    const options = await getTargetFormOptions(target.branch_id);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href={`/targets/${target.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Hedef detayına dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hedefi Düzenle
            </h1>
            <p className="mt-1 text-muted-foreground">{target.name}</p>
          </div>
        </div>

        <TargetForm
          mode="edit"
          initialData={target}
          branches={options.branches}
          assignees={options.assignees}
          defaultBranchId={options.defaultBranchId}
          showBranchSelect={permissions.isAdmin}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof TargetApiError && error.code === "NOT_FOUND") {
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
            href={`/targets/${id}`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Hedef detayına dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
