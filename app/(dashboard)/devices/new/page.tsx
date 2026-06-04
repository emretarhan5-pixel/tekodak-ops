import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { DeviceForm } from "@/components/devices/DeviceForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDeviceFormOptions } from "@/lib/api/devices/get-device-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type NewDevicePageProps = {
  searchParams: Promise<{ customer?: string }>;
};

export default async function NewDevicePage({
  searchParams,
}: NewDevicePageProps) {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect("/devices");
  }

  try {
    const { customer: customerParam } = await searchParams;
    const options = await getDeviceFormOptions();

    const prefillCustomerId =
      customerParam &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        customerParam,
      ) &&
      options.customers.some((c) => c.id === customerParam)
        ? customerParam
        : null;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href="/devices"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Cihazlara dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Cihaz</h1>
            <p className="mt-1 text-muted-foreground">
              Müşteriye bağlı yeni cihaz kaydı oluşturun
            </p>
          </div>
        </div>

        <DeviceForm
          mode="create"
          initialData={null}
          prefillCustomerId={prefillCustomerId}
          customers={options.customers}
          brands={options.brands}
          models={options.models}
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
            href="/devices"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Cihazlara dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
