import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { WorkOrderForm } from "@/components/work-orders/WorkOrderForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getWorkOrderCustomerContracts } from "@/lib/api/work-orders/get-work-order-customer-contracts";
import { getWorkOrderCustomerDevices } from "@/lib/api/work-orders/get-work-order-customer-devices";
import { getWorkOrderFormOptions } from "@/lib/api/work-orders/get-work-order-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type NewWorkOrderPageProps = {
  searchParams: Promise<{ customer?: string }>;
};

export default async function NewWorkOrderPage({
  searchParams,
}: NewWorkOrderPageProps) {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect("/work-orders");
  }

  try {
    const { customer: customerParam } = await searchParams;
    const options = await getWorkOrderFormOptions();

    const prefillCustomerId =
      customerParam &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        customerParam,
      ) &&
      options.customers.some((c) => c.id === customerParam)
        ? customerParam
        : null;

    const [initialCustomerDevices, initialCustomerContracts] =
      prefillCustomerId
        ? await Promise.all([
            getWorkOrderCustomerDevices(prefillCustomerId),
            getWorkOrderCustomerContracts(prefillCustomerId),
          ])
        : [[], []];

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href="/work-orders"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            İş emirlerine dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni İş Emri</h1>
            <p className="mt-1 text-muted-foreground">
              Bakım, onarım veya kurulum için yeni iş emri oluşturun
            </p>
          </div>
        </div>

        <WorkOrderForm
          mode="create"
          initialData={null}
          customers={options.customers}
          assignees={options.assignees}
          prefillCustomerId={prefillCustomerId}
          initialCustomerDevices={initialCustomerDevices}
          initialCustomerContracts={initialCustomerContracts}
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
            href="/work-orders"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            İş emirlerine dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
