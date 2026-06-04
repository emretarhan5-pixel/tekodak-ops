"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ChevronLeft,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ContractStatusBadge } from "@/components/customers/contract-status-badge";
import { CustomerDeleteButton } from "@/components/customers/customer-delete-button";
import { CustomerContracts } from "@/components/customers/CustomerContracts";
import { CustomerDevices } from "@/components/customers/CustomerDevices";
import { CustomerWorkOrders } from "@/components/customers/CustomerWorkOrders";
import { CustomerFiles } from "@/components/customers/customer-files";
import { CustomerPinButton } from "@/components/customers/customer-pin-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants/customer";
import type {
  CustomerDetail,
  CustomerFileRow,
  DeleteCustomerAction,
  DeleteCustomerFileAction,
  GetCustomerDeletionImpactAction,
  GetCustomerFileDownloadUrlAction,
  ToggleCustomerPinAction,
  UploadCustomerFileAction,
} from "@/lib/api/customers/types";
import type { CustomerContractListItem } from "@/lib/api/contracts/types";
import type { CustomerDeviceItem } from "@/lib/api/devices/types";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";
import { formatTurkishPhoneDisplay } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";

type CustomerDetailProps = {
  customer: CustomerDetail;
  devices: CustomerDeviceItem[];
  contracts: CustomerContractListItem[];
  workOrders: WorkOrderListItem[];
  files: CustomerFileRow[];
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  togglePinAction: ToggleCustomerPinAction;
  uploadFileAction: UploadCustomerFileAction;
  deleteFileAction: DeleteCustomerFileAction;
  getDownloadUrlAction: GetCustomerFileDownloadUrlAction;
  deleteCustomerAction: DeleteCustomerAction;
  getDeletionImpactAction: GetCustomerDeletionImpactAction;
};

const TAB_OPTIONS = [
  { value: "general", label: "Genel" },
  { value: "devices", label: "Cihazlar" },
  { value: "contracts", label: "Sözleşmeler" },
  { value: "work-history", label: "İş Geçmişi" },
  { value: "files", label: "Dosyalar" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

const STAT_CARDS = [
  { key: "active_devices" as const, label: "Aktif Cihaz", icon: Printer },
  { key: "active_contracts" as const, label: "Aktif Sözleşme", icon: FileText },
  { key: "open_work_orders" as const, label: "Açık İş", icon: Wrench },
  { key: "completed_work_orders" as const, label: "Tamamlanan İş", icon: Wrench },
] as const;

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

function formatDate(value: string): string {
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const display = value?.trim() || "—";

  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">
        {href && value ? (
          <a href={href} className="text-primary hover:underline">
            {display}
          </a>
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

export function CustomerDetail({
  customer,
  devices,
  contracts,
  workOrders,
  files,
  currentUserId,
  isAdmin,
  canEdit,
  togglePinAction,
  uploadFileAction,
  deleteFileAction,
  getDownloadUrlAction,
  deleteCustomerAction,
  getDeletionImpactAction,
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("general");

  return (
    <div className="space-y-4">
      <Link
        href="/customers"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1 px-0",
        )}
      >
        <ChevronLeft className="size-4" />
        Müşterilere dön
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
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {customer.name}
                  </h1>
                  <ContractStatusBadge status={customer.contract_badge} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    {customer.city}
                    {customer.district ? ` / ${customer.district}` : ""}
                  </span>
                  <span>Vergi no: {customer.tax_number}</span>
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      <Mail className="size-3.5 shrink-0" />
                      {customer.email}
                    </a>
                  ) : null}
                  <a
                    href={`tel:+90${customer.main_phone}`}
                    className="inline-flex items-center gap-1 hover:text-primary"
                  >
                    <Phone className="size-3.5 shrink-0" />
                    {formatTurkishPhoneDisplay(customer.main_phone)}
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">
                    {customer.branch_name} ({customer.branch_code})
                  </Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    {customer.responsible_users.length > 0 ? (
                      customer.responsible_users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 py-0.5 pr-2 pl-0.5"
                        >
                          <Avatar size="sm">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {user.full_name}
                            {user.is_primary ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · Birincil
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sorumlu atanmamış
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <Pencil className="size-4" />
                  Düzenle
                </Link>
                <CustomerPinButton
                  customerId={customer.id}
                  isPinned={customer.is_pinned}
                  togglePinAction={togglePinAction}
                />
                <CustomerDeleteButton
                  customerId={customer.id}
                  customerName={customer.name}
                  activeContracts={customer.stats.active_contracts}
                  openWorkOrders={customer.stats.open_work_orders}
                  deleteCustomerAction={deleteCustomerAction}
                  getDeletionImpactAction={getDeletionImpactAction}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map(({ key, label, icon: Icon }) => (
                <Card key={key} className="shadow-none">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {customer.stats[key]}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="md:hidden">
              <Label htmlFor="customer-tab-select" className="sr-only">
                Sekme seçin
              </Label>
              <select
                id="customer-tab-select"
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
              <TabsTrigger value="devices">🖨️ Cihazlar</TabsTrigger>
              <TabsTrigger value="contracts">📋 Sözleşmeler</TabsTrigger>
              <TabsTrigger value="work-history">🛠️ İş Geçmişi</TabsTrigger>
              <TabsTrigger value="files">📎 Dosyalar</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>İletişim bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow label="Kurum adı" value={customer.name} />
                  <InfoRow
                    label="Müşteri tipi"
                    value={CUSTOMER_TYPE_LABELS[customer.customer_type]}
                  />
                  <InfoRow label="Vergi dairesi" value={customer.tax_office} />
                  <InfoRow label="Vergi no" value={customer.tax_number} />
                  <InfoRow label="Sektör" value={customer.sector} />
                  <InfoRow
                    label="Ana telefon"
                    value={formatTurkishPhoneDisplay(customer.main_phone)}
                    href={`tel:+90${customer.main_phone}`}
                  />
                  <InfoRow
                    label="E-posta"
                    value={customer.email}
                    href={
                      customer.email ? `mailto:${customer.email}` : undefined
                    }
                  />
                  <InfoRow
                    label="Web sitesi"
                    value={customer.website}
                    href={customer.website ?? undefined}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İlgili kişiler</CardTitle>
                <CardDescription>
                  Müşteri tarafı iletişim kişileri
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Kayıtlı ilgili kişi yok.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad</TableHead>
                          <TableHead>Unvan</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>E-posta</TableHead>
                          <TableHead>Birincil</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">
                              {contact.full_name}
                            </TableCell>
                            <TableCell>{contact.title ?? "—"}</TableCell>
                            <TableCell>
                              {contact.phone
                                ? formatTurkishPhoneDisplay(contact.phone)
                                : "—"}
                            </TableCell>
                            <TableCell>{contact.email ?? "—"}</TableCell>
                            <TableCell>
                              {contact.is_primary ? (
                                <Badge variant="outline">Birincil</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adres</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow label="İl" value={customer.city} />
                  <InfoRow label="İlçe" value={customer.district} />
                  <InfoRow label="Adres" value={customer.full_address} />
                </dl>
              </CardContent>
            </Card>

            {customer.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Notlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Kayıt bilgisi</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <InfoRow
                    label="Oluşturulma"
                    value={formatDate(customer.created_at)}
                  />
                  <InfoRow
                    label="Son güncelleme"
                    value={formatDate(customer.updated_at)}
                  />
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="mt-0">
            <CustomerDevices
              customerId={customer.id}
              devices={devices}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="contracts" className="mt-0">
            <CustomerContracts
              customerId={customer.id}
              contracts={contracts}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="work-history" className="mt-0">
            <CustomerWorkOrders
              customerId={customer.id}
              workOrders={workOrders}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <CustomerFiles
              customerId={customer.id}
              files={files}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
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
