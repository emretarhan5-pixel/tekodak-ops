"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ContractFiles } from "@/components/contracts/ContractFiles";
import { ContractMaintenancePlan } from "@/components/contracts/ContractMaintenancePlan";
import { ContractWorkOrders } from "@/components/contracts/ContractWorkOrders";
import { ContractRenewalBadgeDisplay } from "@/components/contracts/contract-renewal-badge";
import { DeleteContractButton } from "@/components/contracts/DeleteContractButton";
import { RenewContractButton } from "@/components/contracts/RenewContractButton";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ContractDetail as ContractDetailData,
  ContractFileRow,
  DeleteContractAction,
  DeleteContractFileAction,
  GetContractDeletionImpactAction,
  GetContractFileDownloadUrlAction,
  UploadContractFileAction,
} from "@/lib/api/contracts/types";
import type { MaintenancePlanListItem } from "@/lib/api/maintenance/types";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";
import {
  CONTRACT_PAYMENT_METHOD_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_WORKING_HOURS_LABELS,
} from "@/lib/constants/contract";
import { formatContractPrice } from "@/lib/utils/format-contract-price";
import { cn } from "@/lib/utils";

const TAB_OPTIONS = [
  { value: "general", label: "Genel" },
  { value: "devices", label: "Kapsanan Cihazlar" },
  { value: "maintenance", label: "Bakım Planı" },
  { value: "work-history", label: "İş Geçmişi" },
  { value: "files", label: "Dosyalar" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type ContractDetailProps = {
  contract: ContractDetailData;
  workOrders: WorkOrderListItem[];
  maintenancePlans: MaintenancePlanListItem[];
  files: ContractFileRow[];
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  initialTab?: TabValue;
  uploadFileAction: UploadContractFileAction;
  deleteFileAction: DeleteContractFileAction;
  getDownloadUrlAction: GetContractFileDownloadUrlAction;
  deleteContractAction: DeleteContractAction;
  getDeletionImpactAction: GetContractDeletionImpactAction;
};

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy", { locale: tr });
  } catch {
    return "—";
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} gün geçti`;
  }
  if (days === 0) {
    return "Bugün bitiyor";
  }
  return `${days} gün kaldı`;
}

function InfoRow({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
  mono?: boolean;
}) {
  const display = value?.trim() || "—";

  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm font-medium break-words",
          mono && "font-mono",
        )}
      >
        {href && value ? (
          <Link href={href} className="text-primary hover:underline">
            {display}
          </Link>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="font-medium">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function boolLabel(value: boolean): string {
  return value ? "Evet" : "Hayır";
}

export function ContractDetail({
  contract,
  workOrders,
  maintenancePlans,
  files,
  currentUserId,
  isAdmin,
  canEdit,
  initialTab,
  uploadFileAction,
  deleteFileAction,
  getDownloadUrlAction,
  deleteContractAction,
  getDeletionImpactAction,
}: ContractDetailProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab ?? "general");

  const priceLabel = formatContractPrice(
    contract.agreed_price,
    contract.currency,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/contracts"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1 px-0",
        )}
      >
        <ChevronLeft className="size-4" />
        Sözleşmelere dön
      </Link>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        className="gap-0"
      >
        <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 px-4 pb-4 backdrop-blur supports-backdrop-filter:backdrop-blur-sm md:-mx-6 md:px-6">
          <div className="space-y-4 pt-1">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-mono text-2xl font-bold tracking-tight md:text-3xl">
                    {contract.contract_number}
                  </h1>
                  <ContractRenewalBadgeDisplay
                    renewalBadge={contract.renewal_badge}
                    status={contract.status}
                  />
                </div>

                <p className="text-lg text-muted-foreground">
                  {CONTRACT_TYPE_LABELS[contract.contract_type]}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>
                    Müşteri:{" "}
                    <Link
                      href={`/customers/${contract.customer_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {contract.customer_name}
                    </Link>
                  </span>
                  <span className="font-medium text-foreground">
                    {priceLabel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5 shrink-0" />
                    {formatDateOnly(contract.start_date)} –{" "}
                    {formatDateOnly(contract.end_date)}
                  </span>
                  <span>{formatDaysRemaining(contract.days_remaining)}</span>
                  <span>
                    {contract.branch_name} ({contract.branch_code})
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {canEdit ? (
                  <Link
                    href={`/contracts/${contract.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "gap-1.5",
                    )}
                  >
                    <Pencil className="size-4" />
                    Düzenle
                  </Link>
                ) : null}
                <RenewContractButton contract={contract} canEdit={canEdit} />
                <DeleteContractButton
                  contractId={contract.id}
                  contractNumber={contract.contract_number}
                  deleteContractAction={deleteContractAction}
                  getDeletionImpactAction={getDeletionImpactAction}
                />
              </div>
            </div>

            <div className="md:hidden">
              <Label htmlFor="contract-tab-select" className="sr-only">
                Sekme seçin
              </Label>
              <select
                id="contract-tab-select"
                className={selectClassName}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabValue)}
              >
                {TAB_OPTIONS.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <TabsList className="hidden w-full md:inline-flex">
              <TabsTrigger value="general">📋 Genel</TabsTrigger>
              <TabsTrigger value="devices">🖨️ Kapsanan Cihazlar</TabsTrigger>
              <TabsTrigger value="maintenance">🔧 Bakım Planı</TabsTrigger>
              <TabsTrigger value="work-history">🛠️ İş Geçmişi</TabsTrigger>
              <TabsTrigger value="files">📎 Dosyalar</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sözleşme bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Sözleşme no"
                    value={contract.contract_number}
                    mono
                  />
                  <InfoRow
                    label="Müşteri"
                    value={contract.customer_name}
                    href={`/customers/${contract.customer_id}`}
                  />
                  <InfoRow
                    label="Şube"
                    value={`${contract.branch_name} (${contract.branch_code})`}
                  />
                  <InfoRow
                    label="Sözleşme tipi"
                    value={CONTRACT_TYPE_LABELS[contract.contract_type]}
                  />
                  <InfoRow
                    label="Başlangıç"
                    value={formatDateOnly(contract.start_date)}
                  />
                  <InfoRow
                    label="Bitiş"
                    value={formatDateOnly(contract.end_date)}
                  />
                  <InfoRow
                    label="Kalan süre"
                    value={formatDaysRemaining(contract.days_remaining)}
                  />
                  <InfoRow label="Tutar" value={priceLabel} />
                  <InfoRow
                    label="Sorumlu"
                    value={contract.responsible_name}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ödeme ve koşullar</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Ödeme yöntemi"
                    value={
                      CONTRACT_PAYMENT_METHOD_LABELS[contract.payment_method]
                    }
                  />
                  <InfoRow
                    label="Ödeme koşulları"
                    value={contract.special_terms}
                  />
                  <InfoRow
                    label="Liste fiyatı"
                    value={
                      contract.list_price != null
                        ? formatContractPrice(
                            contract.list_price,
                            contract.currency,
                          )
                        : null
                    }
                  />
                  <InfoRow
                    label="Minimum fiyat"
                    value={
                      contract.minimum_price != null
                        ? formatContractPrice(
                            contract.minimum_price,
                            contract.currency,
                          )
                        : null
                    }
                  />
                  <InfoRow
                    label="KDV dahil"
                    value={boolLabel(contract.vat_included)}
                  />
                  <InfoRow
                    label="KDV oranı"
                    value={`%${contract.vat_rate}`}
                  />
                  <InfoRow label="Notlar" value={contract.notes} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hizmet kapsamı</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Yıllık bakım sayısı (toplam)"
                    value={String(contract.total_maintenance_count)}
                  />
                  <InfoRow
                    label="Tamamlanan bakım"
                    value={String(contract.completed_maintenance_count)}
                  />
                  <InfoRow
                    label="SLA yanıt (saat)"
                    value={String(contract.sla_response_hours)}
                  />
                  <InfoRow
                    label="Parça dahil"
                    value={boolLabel(contract.parts_included)}
                  />
                  <InfoRow
                    label="Yol dahil"
                    value={boolLabel(contract.travel_included)}
                  />
                  <InfoRow
                    label="Çalışma saatleri"
                    value={
                      CONTRACT_WORKING_HOURS_LABELS[contract.working_hours]
                    }
                  />
                  {contract.renewed_from ? (
                    <InfoRow
                      label="Önceki sözleşme"
                      value={contract.renewed_from.contract_number}
                      href={`/contracts/${contract.renewed_from.id}`}
                      mono
                    />
                  ) : null}
                  {contract.renewed_to ? (
                    <InfoRow
                      label="Yenilenen sözleşme"
                      value={contract.renewed_to.contract_number}
                      href={`/contracts/${contract.renewed_to.id}`}
                      mono
                    />
                  ) : null}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kayıt bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Oluşturulma"
                    value={formatDateTime(contract.created_at)}
                  />
                  <InfoRow
                    label="Son güncelleme"
                    value={formatDateTime(contract.updated_at)}
                  />
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Kapsanan cihazlar</CardTitle>
              </CardHeader>
              <CardContent>
                {contract.devices.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
                    Bu sözleşmeye bağlı cihaz yok
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seri no</TableHead>
                          <TableHead>Marka / model</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.devices.map((device) => (
                          <TableRow key={device.id}>
                            <TableCell>
                              <Link
                                href={`/devices/${device.device_id}`}
                                className="font-mono font-medium text-primary hover:underline"
                              >
                                {device.serial_number}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {device.brand_name} {device.model_name}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0">
            <ContractMaintenancePlan
              contract={contract}
              maintenancePlans={maintenancePlans}
              canEdit={canEdit}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="work-history" className="mt-0">
            <ContractWorkOrders
              customerId={contract.customer_id}
              workOrders={workOrders}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <ContractFiles
              contractId={contract.id}
              files={files}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              canEdit={canEdit}
              uploadFileAction={uploadFileAction}
              deleteFileAction={deleteFileAction}
              getDownloadUrlAction={getDownloadUrlAction}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
