"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeftRight,
  ChevronLeft,
  MapPin,
  Pencil,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DeleteStockItemButton } from "@/components/stock/DeleteStockItemButton";
import { StockMovementModal } from "@/components/stock/StockMovementModal";
import { StockMovements } from "@/components/stock/StockMovements";
import { StockRelatedWorkOrders } from "@/components/stock/StockRelatedWorkOrders";
import { StockStatusBadge } from "@/components/stock/stock-status-badge";
import {
  formatStockQuantity,
} from "@/components/stock/stock-utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DeleteStockItemAction,
  GetStockItemDeletionImpactAction,
  StockItemDetail as StockItemDetailData,
} from "@/lib/api/stock/types";
import { PART_UNIT_LABELS } from "@/lib/constants/stock-item";
import { cn } from "@/lib/utils";

const TAB_OPTIONS = [
  { value: "general", label: "Genel" },
  { value: "movements", label: "Hareketler" },
  { value: "work-orders", label: "İlişkili İş Emirleri" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type StockItemDetailProps = {
  item: StockItemDetailData;
  canEdit: boolean;
  initialTab?: TabValue;
  openMovementOnMount?: boolean;
  deleteStockItemAction: DeleteStockItemAction;
  getDeletionImpactAction: GetStockItemDeletionImpactAction;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-medium break-words", mono && "font-mono")}>
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

function stockQuantityAccent(
  quantity: number,
  variant: StockItemDetailData["branch"]["status_variant"],
): string {
  if (quantity <= 0) {
    return "border-border bg-muted/50 text-muted-foreground";
  }
  switch (variant) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
    case "destructive":
      return "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100";
    case "outline":
      return "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100";
    default:
      return "border-border bg-muted/40";
  }
}

export function StockItemDetail({
  item,
  canEdit,
  initialTab = "general",
  openMovementOnMount = false,
  deleteStockItemAction,
  getDeletionImpactAction,
}: StockItemDetailProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [movementModalOpen, setMovementModalOpen] = useState(openMovementOnMount);

  const branchId = item.branch.branch_id;
  const editHref = `/stock/${item.part_id}/edit?branchId=${branchId}`;

  const quantityDisplay = useMemo(
    () => formatStockQuantity(item.branch.current_quantity, item.unit),
    [item.branch.current_quantity, item.unit],
  );

  const criticalDisplay = useMemo(
    () => formatStockQuantity(item.branch.min_stock, item.unit),
    [item.branch.min_stock, item.unit],
  );

  return (
    <div className="space-y-4">
      <Link
        href="/stock"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1 px-0",
        )}
      >
        <ChevronLeft className="size-4" />
        Stok listesine dön
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
                    {item.part_code}
                  </h1>
                  <StockStatusBadge
                    status={item.branch.stock_status}
                    variant={item.branch.status_variant}
                    currentQuantity={item.branch.current_quantity}
                  />
                  <Badge variant="outline">{item.category_label}</Badge>
                </div>

                <p className="text-lg text-muted-foreground">{item.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    {item.branch.branch_name} ({item.branch.branch_code})
                  </span>
                  {item.brand_name ? (
                    <span>
                      Marka:{" "}
                      <span className="font-medium text-foreground">
                        {item.brand_name}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {canEdit ? (
                  <>
                    <Link
                      href={editHref}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1.5",
                      )}
                    >
                      <Pencil className="size-4" />
                      Düzenle
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setActiveTab("movements");
                        setMovementModalOpen(true);
                      }}
                    >
                      <ArrowLeftRight className="size-4" />
                      Hareket Ekle
                    </Button>
                  </>
                ) : null}
                <DeleteStockItemButton
                  partId={item.part_id}
                  partCode={item.part_code}
                  deleteStockItemAction={deleteStockItemAction}
                  getDeletionImpactAction={getDeletionImpactAction}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={cn(
                  "rounded-xl border-2 p-4 shadow-xs",
                  stockQuantityAccent(
                    item.branch.current_quantity,
                    item.branch.status_variant,
                  ),
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                  Mevcut Stok
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                  {quantityDisplay}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Kritik Seviye
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {criticalDisplay}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Birim
                </p>
                <p className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                  <Package className="size-5 text-muted-foreground" />
                  {PART_UNIT_LABELS[item.unit]}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid w-full gap-2 sm:max-w-xs">
                <Label htmlFor="stock-tab-select" className="sr-only">
                  Sekme
                </Label>
                <select
                  id="stock-tab-select"
                  className={cn(selectClassName, "sm:hidden")}
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
              <TabsList className="hidden h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 sm:flex">
                {TAB_OPTIONS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-muted"
                  >
                    {tab.label}
                    {tab.value === "movements" && item.movements.length > 0 ? (
                      <Badge variant="secondary" className="ml-1.5 text-[10px]">
                        {item.movements.length}
                      </Badge>
                    ) : null}
                    {tab.value === "work-orders" &&
                    item.related_work_orders.length > 0 ? (
                      <Badge variant="secondary" className="ml-1.5 text-[10px]">
                        {item.related_work_orders.length}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <TabsContent value="general" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Ürün Bilgileri</CardTitle>
                <CardDescription>
                  Stok kartı ve tedarik bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <InfoRow label="Ürün Kodu" value={item.part_code} mono />
                  <InfoRow label="Ürün Adı" value={item.description} />
                  <InfoRow label="Kategori" value={item.category_label} />
                  <InfoRow label="Marka" value={item.brand_name} />
                  <InfoRow label="Birim" value={PART_UNIT_LABELS[item.unit]} />
                  <InfoRow label="Şube" value={item.branch.branch_name} />
                  <InfoRow
                    label="Mevcut Stok"
                    value={quantityDisplay}
                  />
                  <InfoRow
                    label="Kritik Seviye"
                    value={criticalDisplay}
                  />
                  {item.branch.max_stock != null ? (
                    <InfoRow
                      label="Maksimum Stok"
                      value={formatStockQuantity(
                        item.branch.max_stock,
                        item.unit,
                      )}
                    />
                  ) : null}
                  <InfoRow
                    label="Liste Fiyatı"
                    value={
                      item.list_price != null
                        ? `${item.list_price.toLocaleString("tr-TR")} ₺`
                        : null
                    }
                  />
                  <InfoRow
                    label="Birim Maliyet"
                    value={
                      item.unit_cost != null
                        ? `${item.unit_cost.toLocaleString("tr-TR")} ₺`
                        : null
                    }
                  />
                  <InfoRow label="Tedarikçi" value={item.supplier_name} />
                  <InfoRow label="Tedarikçi Kodu" value={item.supplier_code} mono />
                  <InfoRow label="Oluşturan" value={item.created_by_name} />
                  <InfoRow
                    label="Oluşturulma"
                    value={formatDateTime(item.created_at)}
                  />
                  <InfoRow
                    label="Son Güncelleme"
                    value={formatDateTime(item.updated_at)}
                  />
                  {item.notes ? (
                    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
                      <dt className="text-sm text-muted-foreground">Açıklama</dt>
                      <dd className="text-sm whitespace-pre-wrap">{item.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="mt-0 space-y-4">
            {canEdit ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setMovementModalOpen(true)}
                >
                  + Hareket Ekle
                </Button>
              </div>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Stok Hareketleri</CardTitle>
                <CardDescription>
                  Giriş, çıkış ve transfer kayıtları (kronolojik)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockMovements
                  movements={item.movements}
                  unit={item.unit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work-orders" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>İlişkili İş Emirleri</CardTitle>
                <CardDescription>
                  Bu parçanın iş emirlerinde kullanım geçmişi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockRelatedWorkOrders
                  items={item.related_work_orders}
                  unit={item.unit}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {canEdit ? (
        <StockMovementModal
          open={movementModalOpen}
          onOpenChange={setMovementModalOpen}
          partId={item.part_id}
          branchId={branchId}
          onSuccess={() => setActiveTab("movements")}
        />
      ) : null}
    </div>
  );
}
