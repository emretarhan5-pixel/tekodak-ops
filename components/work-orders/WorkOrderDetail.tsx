"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, ChevronLeft, Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DeleteWorkOrderButton } from "@/components/work-orders/DeleteWorkOrderButton";
import { WorkOrderActivities } from "@/components/work-orders/WorkOrderActivities";
import { WorkOrderFiles } from "@/components/work-orders/WorkOrderFiles";
import { WorkOrderParts } from "@/components/work-orders/WorkOrderParts";
import { WorkOrderPhotos } from "@/components/work-orders/WorkOrderPhotos";
import { WorkOrderStatusActions } from "@/components/work-orders/WorkOrderStatusActions";
import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getWorkOrderStatusVariant,
  isTerminalWorkOrderStatus,
} from "@/lib/api/work-orders/work-order-status";
import type {
  AddWorkOrderNoteAction,
  AddWorkOrderPartAction,
  DeleteWorkOrderAction,
  DeleteWorkOrderFileAction,
  DeleteWorkOrderPhotoAction,
  GetWorkOrderDeletionImpactAction,
  GetWorkOrderFileDownloadUrlAction,
  GetWorkOrderPartOptionsAction,
  GetWorkOrderPhotoUrlAction,
  RemoveWorkOrderPartAction,
  UpdateWorkOrderStatusAction,
  UploadWorkOrderFileAction,
  UploadWorkOrderPhotoAction,
  WorkOrderDetail as WorkOrderDetailData,
} from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/constants/work-order";
import { useDashboardUser } from "@/components/providers/dashboard-user-provider";
import { getPermissions } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

const TAB_OPTIONS = [
  { value: "general", label: "Genel" },
  { value: "activities", label: "Aktiviteler" },
  { value: "parts", label: "Kullanılan Parçalar" },
  { value: "photos", label: "Fotoğraflar" },
  { value: "files", label: "Dosyalar" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type WorkOrderDetailProps = {
  workOrder: WorkOrderDetailData;
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  updateStatusAction: UpdateWorkOrderStatusAction;
  deleteWorkOrderAction: DeleteWorkOrderAction;
  getDeletionImpactAction: GetWorkOrderDeletionImpactAction;
  uploadFileAction: UploadWorkOrderFileAction;
  deleteFileAction: DeleteWorkOrderFileAction;
  getFileDownloadUrlAction: GetWorkOrderFileDownloadUrlAction;
  uploadPhotoAction: UploadWorkOrderPhotoAction;
  deletePhotoAction: DeleteWorkOrderPhotoAction;
  getPhotoUrlAction: GetWorkOrderPhotoUrlAction;
  addNoteAction: AddWorkOrderNoteAction;
  getPartOptionsAction: GetWorkOrderPartOptionsAction;
  addPartAction: AddWorkOrderPartAction;
  removePartAction: RemoveWorkOrderPartAction;
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

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function formatDuration(
  hours: number | null,
  pausedSeconds: number | null,
): string {
  if (hours == null) return "—";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const paused =
    pausedSeconds != null && pausedSeconds > 0
      ? ` (bekleme: ${Math.round(pausedSeconds / 60)} dk)`
      : "";
  if (h > 0) {
    return `${h} sa ${m} dk${paused}`;
  }
  return `${m} dk${paused}`;
}

function deviceLabel(workOrder: WorkOrderDetailData): string | null {
  if (!workOrder.device_id) return null;
  const parts = [
    workOrder.device_serial,
    workOrder.device_brand_name,
    workOrder.device_model_name,
  ].filter(Boolean);
  return parts.join(" · ") || workOrder.device_serial;
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

function EmptyTab({
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

function priorityBadgeClass(priority: WorkOrderDetailData["priority"]): string {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200";
    case "normal":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "low":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "";
  }
}

export function WorkOrderDetail({
  workOrder,
  currentUserId,
  isAdmin,
  canEdit,
  updateStatusAction,
  deleteWorkOrderAction,
  getDeletionImpactAction,
  uploadFileAction,
  deleteFileAction,
  getFileDownloadUrlAction,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
  addNoteAction,
  getPartOptionsAction,
  addPartAction,
  removePartAction,
}: WorkOrderDetailProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("general");
  const dashboardUser = useDashboardUser();
  const { isAuthenticated } = getPermissions(dashboardUser);

  const deviceDisplay = useMemo(() => deviceLabel(workOrder), [workOrder]);
  const isTerminal = isTerminalWorkOrderStatus(workOrder.status);
  const statusVariant = getWorkOrderStatusVariant(workOrder.status);
  const canManageWorkOrder = isAuthenticated && !isTerminal;

  const scheduledLabel = workOrder.scheduled_date
    ? `${formatDateOnly(workOrder.scheduled_date)}${workOrder.scheduled_time ? ` ${formatTime(workOrder.scheduled_time)}` : ""}`
    : "—";

  return (
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
                    {workOrder.work_order_number}
                  </h1>
                  <WorkOrderStatusBadge
                    status={workOrder.status}
                    variant={statusVariant}
                  />
                  <Badge
                    className={cn(
                      "font-normal",
                      priorityBadgeClass(workOrder.priority),
                    )}
                  >
                    {WORK_ORDER_PRIORITY_LABELS[workOrder.priority]}
                  </Badge>
                  {workOrder.sla_breached ? (
                    <Badge variant="outline" className="border-red-300 text-red-700">
                      SLA aşıldı
                    </Badge>
                  ) : null}
                </div>

                <p className="text-lg text-muted-foreground">
                  {WORK_ORDER_TYPE_LABELS[workOrder.work_type]}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>
                    Müşteri:{" "}
                    <Link
                      href={`/customers/${workOrder.customer_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {workOrder.customer_name}
                    </Link>
                  </span>
                  {workOrder.device_id && deviceDisplay ? (
                    <span>
                      Cihaz:{" "}
                      <Link
                        href={`/devices/${workOrder.device_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {deviceDisplay}
                      </Link>
                    </span>
                  ) : (
                    <span>Cihaz: —</span>
                  )}
                  <span>
                    Atanan:{" "}
                    <span className="font-medium text-foreground">
                      {workOrder.assignee_name ?? "—"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5 shrink-0" />
                    Planlanan: {scheduledLabel}
                  </span>
                  <span>
                    {workOrder.branch_name} ({workOrder.branch_code})
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {canManageWorkOrder ? (
                  <Link
                    href={`/work-orders/${workOrder.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "gap-1.5",
                    )}
                  >
                    <Pencil className="size-4" />
                    Düzenle
                  </Link>
                ) : null}
                <WorkOrderStatusActions
                  workOrderId={workOrder.id}
                  status={workOrder.status}
                  assignedTo={workOrder.assigned_to}
                  enabled={canManageWorkOrder}
                  updateStatusAction={updateStatusAction}
                />
                <DeleteWorkOrderButton
                  workOrderId={workOrder.id}
                  workOrderNumber={workOrder.work_order_number}
                  deleteWorkOrderAction={deleteWorkOrderAction}
                  getDeletionImpactAction={getDeletionImpactAction}
                />
              </div>
            </div>

            <div className="md:hidden">
              <Label htmlFor="work-order-tab-select" className="sr-only">
                Sekme seçin
              </Label>
              <select
                id="work-order-tab-select"
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
              <TabsTrigger value="activities">
                📜 Aktiviteler
                {workOrder.activities.length > 0
                  ? ` (${workOrder.activities.length})`
                  : ""}
              </TabsTrigger>
              <TabsTrigger value="parts">
                🔧 Parçalar
                {workOrder.parts.length > 0
                  ? ` (${workOrder.parts.length})`
                  : ""}
              </TabsTrigger>
              <TabsTrigger value="photos">
                📷 Fotoğraflar
                {workOrder.photos.length > 0
                  ? ` (${workOrder.photos.length})`
                  : ""}
              </TabsTrigger>
              <TabsTrigger value="files">
                📎 Dosyalar
                {workOrder.files.length > 0
                  ? ` (${workOrder.files.length})`
                  : ""}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>İş tanımı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {workOrder.problem_description}
                </p>
                {workOrder.work_performed ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Yapılan iş
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {workOrder.work_performed}
                    </p>
                  </div>
                ) : null}
                {workOrder.internal_notes ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dahili notlar
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {workOrder.internal_notes}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kayıt bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="İş emri no"
                    value={workOrder.work_order_number}
                    mono
                  />
                  <InfoRow
                    label="Müşteri"
                    value={workOrder.customer_name}
                    href={`/customers/${workOrder.customer_id}`}
                  />
                  <InfoRow
                    label="Cihaz"
                    value={deviceDisplay}
                    href={
                      workOrder.device_id
                        ? `/devices/${workOrder.device_id}`
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Sözleşme"
                    value={workOrder.contract_number}
                    href={
                      workOrder.contract_id
                        ? `/contracts/${workOrder.contract_id}`
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Şube"
                    value={`${workOrder.branch_name} (${workOrder.branch_code})`}
                  />
                  <InfoRow
                    label="İş tipi"
                    value={WORK_ORDER_TYPE_LABELS[workOrder.work_type]}
                  />
                  <InfoRow
                    label="Durum"
                    value={WORK_ORDER_STATUS_LABELS[workOrder.status]}
                  />
                  <InfoRow
                    label="Öncelik"
                    value={WORK_ORDER_PRIORITY_LABELS[workOrder.priority]}
                  />
                  <InfoRow
                    label="Sözleşme kapsamında"
                    value={workOrder.is_under_contract ? "Evet" : "Hayır"}
                  />
                  <InfoRow
                    label="Oluşturan"
                    value={workOrder.created_by_name}
                  />
                  <InfoRow
                    label="Oluşturulma"
                    value={formatDateTime(workOrder.created_at)}
                  />
                  <InfoRow
                    label="Son güncelleme"
                    value={formatDateTime(workOrder.updated_at)}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  Zaman takibi
                </CardTitle>
                <CardDescription>
                  Durum değişimlerinde sistem otomatik zaman damgası atar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Planlanan"
                    value={scheduledLabel}
                  />
                  <InfoRow
                    label="Atanma"
                    value={formatDateTime(workOrder.assigned_at)}
                  />
                  <InfoRow
                    label="İş başlangıcı"
                    value={formatDateTime(workOrder.work_started_at)}
                  />
                  <InfoRow
                    label="İş bitişi"
                    value={formatDateTime(workOrder.work_ended_at)}
                  />
                  <InfoRow
                    label="Gerçek süre"
                    value={formatDuration(
                      workOrder.actual_duration_hours,
                      workOrder.total_paused_seconds,
                    )}
                  />
                  <InfoRow
                    label="SLA son tarih"
                    value={formatDateTime(workOrder.sla_deadline)}
                  />
                  {workOrder.cancelled_at ? (
                    <>
                      <InfoRow
                        label="İptal zamanı"
                        value={formatDateTime(workOrder.cancelled_at)}
                      />
                      <InfoRow
                        label="İptal gerekçesi"
                        value={workOrder.cancellation_reason}
                      />
                    </>
                  ) : null}
                  {workOrder.hold_reason ? (
                    <InfoRow
                      label="Bekleme gerekçesi"
                      value={workOrder.hold_reason}
                    />
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-0">
            <WorkOrderActivities
              workOrderId={workOrder.id}
              activities={workOrder.activities}
              canEdit={canEdit}
              addNoteAction={addNoteAction}
            />
          </TabsContent>

          <TabsContent value="parts" className="mt-0">
            <WorkOrderParts
              workOrderId={workOrder.id}
              branchId={workOrder.branch_id}
              parts={workOrder.parts}
              canEdit={canEdit && canManageWorkOrder}
              getPartOptionsAction={getPartOptionsAction}
              addPartAction={addPartAction}
              removePartAction={removePartAction}
            />
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <WorkOrderPhotos
              workOrderId={workOrder.id}
              photos={workOrder.photos}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              canEdit={canEdit}
              uploadPhotoAction={uploadPhotoAction}
              deletePhotoAction={deletePhotoAction}
              getPhotoUrlAction={getPhotoUrlAction}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <WorkOrderFiles
              workOrderId={workOrder.id}
              files={workOrder.files}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              canEdit={canEdit}
              uploadFileAction={uploadFileAction}
              deleteFileAction={deleteFileAction}
              getDownloadUrlAction={getFileDownloadUrlAction}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
