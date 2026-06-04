import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { DeviceForm } from "@/components/devices/DeviceForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeviceApiError } from "@/lib/api/devices/auth";
import { getDeviceById } from "@/lib/api/devices/get-device-by-id";
import { getDeviceFormOptions } from "@/lib/api/devices/get-device-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type EditDevicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDevicePage({ params }: EditDevicePageProps) {
  const { id } = await params;
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect(`/devices/${id}`);
  }

  try {
    const [device, options] = await Promise.all([
      getDeviceById(id),
      getDeviceFormOptions(),
    ]);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href={`/devices/${device.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Cihaz detayına dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cihazı Düzenle</h1>
            <p className="mt-1 font-mono text-muted-foreground">
              {device.serial_number} · {device.brand_name} {device.model_name}
            </p>
          </div>
        </div>

        <DeviceForm
          mode="edit"
          initialData={device}
          customers={options.customers}
          brands={options.brands}
          models={options.models}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof DeviceApiError && error.code === "NOT_FOUND") {
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
