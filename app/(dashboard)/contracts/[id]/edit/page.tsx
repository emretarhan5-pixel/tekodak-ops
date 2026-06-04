import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ContractForm } from "@/components/contracts/ContractForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContractApiError } from "@/lib/api/contracts/auth";
import { getContractById } from "@/lib/api/contracts/get-contract-by-id";
import { getContractFormOptions } from "@/lib/api/contracts/get-contract-form-options";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

type EditContractPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContractPage({
  params,
}: EditContractPageProps) {
  const { id } = await params;
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);

  if (!permissions.canEdit) {
    redirect(`/contracts/${id}`);
  }

  try {
    const [contract, options] = await Promise.all([
      getContractById(id),
      getContractFormOptions(),
    ]);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          <Link
            href={`/contracts/${contract.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 px-0",
            )}
          >
            <ChevronLeft className="size-4" />
            Sözleşme detayına dön
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sözleşmeyi Düzenle
            </h1>
            <p className="mt-1 font-mono text-muted-foreground">
              {contract.contract_number} · {contract.customer_name}
            </p>
          </div>
        </div>

        <ContractForm
          mode="edit"
          initialData={contract}
          customers={options.customers}
          responsibleUserId={user.id}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof ContractApiError && error.code === "NOT_FOUND") {
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
            href={`/contracts/${id}`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Sözleşme detayına dön
          </Link>
        </CardContent>
      </Card>
    );
  }
}
