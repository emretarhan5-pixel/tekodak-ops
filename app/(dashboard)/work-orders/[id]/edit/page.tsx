import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { WorkOrderForm } from "@/components/work-orders/WorkOrderForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkOrderApiError } from "@/lib/api/work-orders/auth";
import { getWorkOrderById } from "@/lib/api/work-orders/get-work-order-by-id";
import { getWorkOrderCustomerContracts } from "@/lib/api/work-orders/get-work-order-customer-contracts";
import { getWorkOrderCustomerDevices } from "@/lib/api/work-orders/get-work-order-customer-devices";
import { getWorkOrderFormOptions } from "@/lib/api/work-orders/get-work-order-form-options";
import { isTerminalWorkOrderStatus } from "@/lib/api/work-orders/work-order-status";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type EditWorkOrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkOrderPage({
  params,
}: EditWorkOrderPageProps) {
  const { id } = await params;
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect(`/work-orders/${id}`);
  }

  try {
    const [workOrder, options] = await Promise.all([
      getWorkOrderById(id),
      getWorkOrderFormOptions(),
    ]);

    if (isTerminalWorkOrderStatus(workOrder.status)) {
      redirect(`/work-orders/${id}`);
    }

    const [initialCustomerDevices, initialCustomerContracts] =
      await Promise.all([
        getWorkOrderCustomerDevices(workOrder.customer_id),
        getWorkOrderCustomerContracts(workOrder.customer_id),
      ]);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href={`/work-orders/${workOrder.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            İş emri detayına dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              İş Emrini Düzenle
            </h1>
            <p className="mt-1 font-mono text-muted-foreground">
              {workOrder.work_order_number} · {workOrder.customer_name}
            </p>
          </div>
        </div>

        <WorkOrderForm
          mode="edit"
          initialData={workOrder}
          customers={options.customers}
          assignees={options.assignees}
          initialCustomerDevices={initialCustomerDevices}
          initialCustomerContracts={initialCustomerContracts}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof WorkOrderApiError && error.code === "NOT_FOUND") {
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
