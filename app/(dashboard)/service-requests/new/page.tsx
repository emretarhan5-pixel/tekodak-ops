import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ServiceRequestStep1Form } from "@/components/service-requests/ServiceRequestStep1Form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServiceRequestFormOptions } from "@/lib/api/service-requests/get-service-request-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

export default async function NewServiceRequestPage() {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect("/service-requests");
  }

  try {
    const options = await getServiceRequestFormOptions();

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href="/service-requests"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Servis taleplerine dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Yeni Servis Talebi
            </h1>
            <p className="mt-1 text-muted-foreground">
              Adım 1 — müşteri ve cihaz kaydı
            </p>
          </div>
        </div>

        <ServiceRequestStep1Form
          branches={options.branches}
          deviceModels={options.device_models}
          technicianName={user.full_name}
          isAdmin={permissions.isAdmin}
          defaultBranchId={user.branch_id}
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
            href="/service-requests"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Servis taleplerine dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
