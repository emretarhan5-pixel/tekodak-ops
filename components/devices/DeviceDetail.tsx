"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DeleteDeviceButton } from "@/components/devices/DeleteDeviceButton";
import { DeviceScrapApproval } from "@/components/devices/DeviceScrapApproval";
import { DeviceContracts } from "@/components/devices/DeviceContracts";
import { DeviceFiles } from "@/components/devices/DeviceFiles";
import { DeviceWorkOrders } from "@/components/devices/DeviceWorkOrders";
import { DevicePinButton } from "@/components/devices/device-pin-button";
import { WarrantyStatusBadge } from "@/components/devices/warranty-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeWarrantyBadge } from "@/lib/api/devices/device-warranty";
import type {
  DeleteDeviceAction,
  DeleteDeviceFileAction,
  DeviceContractLink,
  DeviceDetail as DeviceDetailData,
  DeviceFileRow,
  GetDeviceDeletionImpactAction,
  GetDeviceFileDownloadUrlAction,
  ToggleDevicePinAction,
  UploadDeviceFileAction,
} from "@/lib/api/devices/types";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";
import {
  DEVICE_STATUS_LABELS,
  type DeviceStatus,
} from "@/lib/constants/device";
import { cn } from "@/lib/utils";

const TAB_OPTIONS = [
  { value: "general", label: "Genel" },
  { value: "work-history", label: "İş Geçmişi" },
  { value: "files", label: "Dosyalar" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type DeviceDetailProps = {
  device: DeviceDetailData;
  contracts: DeviceContractLink[];
  workOrders: WorkOrderListItem[];
  files: DeviceFileRow[];
  currentUserId: string;
  canEdit: boolean;
  isAdmin: boolean;
  togglePinAction: ToggleDevicePinAction;
  uploadFileAction: UploadDeviceFileAction;
  deleteFileAction: DeleteDeviceFileAction;
  getDownloadUrlAction: GetDeviceFileDownloadUrlAction;
  deleteDeviceAction: DeleteDeviceAction;
  getDeletionImpactAction: GetDeviceDeletionImpactAction;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy", { locale: tr });
  } catch {
    return "—";
  }
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

function statusBadgeVariant(
  status: DeviceStatus,
): "default" | "secondary" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "faulty":
      return "outline";
    case "in_service":
      return "secondary";
    case "scrap":
      return "outline";
    default:
      return "outline";
  }
}

export function DeviceDetail({
  device,
  contracts,
  workOrders,
  files,
  currentUserId,
  canEdit,
  isAdmin,
  togglePinAction,
  uploadFileAction,
  deleteFileAction,
  getDownloadUrlAction,
  deleteDeviceAction,
  getDeletionImpactAction,
}: DeviceDetailProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("general");

  const warrantyBadge = useMemo(
    () => computeWarrantyBadge(device.warranty_end_date),
    [device.warranty_end_date],
  );

  return (
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
                    {device.serial_number}
                  </h1>
                  <WarrantyStatusBadge badge={warrantyBadge} />
                  <Badge variant={statusBadgeVariant(device.status)}>
                    {DEVICE_STATUS_LABELS[device.status]}
                  </Badge>
                  {device.is_scrapped ? (
                    <Badge
                      variant="secondary"
                      className="bg-muted text-muted-foreground"
                    >
                      Hek
                    </Badge>
                  ) : null}
                  {device.scrap_status === "pending_approval" ? (
                    <Badge className="border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-100">
                      Onay Bekliyor
                    </Badge>
                  ) : null}
                </div>

                <p className="text-lg text-muted-foreground">
                  {device.brand_name} · {device.model_name}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>
                    Müşteri:{" "}
                    <Link
                      href={`/customers/${device.customer_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {device.customer_name}
                    </Link>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    {device.branch_name} ({device.branch_code})
                  </span>
                  <span>
                    Kurulum: {formatDateOnly(device.installation_date)}
                  </span>
                  {device.location_address ? (
                    <span>Konum: {device.location_address}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {canEdit ? (
                  <Link
                    href={`/devices/${device.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "gap-1.5",
                    )}
                  >
                    <Pencil className="size-4" />
                    Düzenle
                  </Link>
                ) : null}
                <DevicePinButton
                  deviceId={device.id}
                  isPinned={device.is_pinned}
                  togglePinAction={togglePinAction}
                />
                <DeleteDeviceButton
                  deviceId={device.id}
                  serialNumber={device.serial_number}
                  deleteDeviceAction={deleteDeviceAction}
                  getDeletionImpactAction={getDeletionImpactAction}
                />
              </div>
            </div>

            <div className="md:hidden">
              <Label htmlFor="device-tab-select" className="sr-only">
                Sekme seçin
              </Label>
              <select
                id="device-tab-select"
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
              <TabsTrigger value="work-history">🛠️ İş Geçmişi</TabsTrigger>
              <TabsTrigger value="files">📎 Dosyalar</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            {isAdmin && device.scrap_status === "pending_approval" ? (
              <DeviceScrapApproval device={device} />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Cihaz bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Seri no"
                    value={device.serial_number}
                    mono
                  />
                  <InfoRow label="Marka" value={device.brand_name} />
                  <InfoRow label="Model" value={device.model_name} />
                  <InfoRow
                    label="Müşteri"
                    value={device.customer_name}
                    href={`/customers/${device.customer_id}`}
                  />
                  <InfoRow
                    label="Şube"
                    value={`${device.branch_name} (${device.branch_code})`}
                  />
                  <InfoRow
                    label="Üretim yılı"
                    value={
                      device.manufacturing_year != null
                        ? String(device.manufacturing_year)
                        : null
                    }
                  />
                  <InfoRow
                    label="Durum"
                    value={DEVICE_STATUS_LABELS[device.status]}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kurulum ve garanti</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Kurulum tarihi"
                    value={formatDateOnly(device.installation_date)}
                  />
                  <InfoRow
                    label="Garanti bitiş"
                    value={formatDateOnly(device.warranty_end_date)}
                  />
                  <InfoRow
                    label="Marka varsayılan garanti"
                    value={
                      device.default_warranty_years != null
                        ? `${device.default_warranty_years} yıl`
                        : null
                    }
                  />
                  <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
                    <dt className="text-sm text-muted-foreground">
                      Garanti durumu
                    </dt>
                    <dd>
                      <WarrantyStatusBadge badge={warrantyBadge} />
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Konum ve notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Konum / departman"
                    value={device.location_address}
                  />
                  <InfoRow label="Notlar" value={device.notes} />
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
                    value={formatDateTime(device.created_at)}
                  />
                  <InfoRow
                    label="Son güncelleme"
                    value={formatDateTime(device.updated_at)}
                  />
                </dl>
              </CardContent>
            </Card>

            <DeviceContracts contracts={contracts} />
          </TabsContent>

          <TabsContent value="work-history" className="mt-0">
            <DeviceWorkOrders
              deviceId={device.id}
              customerId={device.customer_id}
              workOrders={workOrders}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <DeviceFiles
              deviceId={device.id}
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
