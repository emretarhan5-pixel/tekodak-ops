"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarDays,
  FileText,
  Package,
  Target,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import {
  DashboardEmptyState,
  DashboardListFooter,
  DashboardWidget,
  LIST_PREVIEW_LIMIT,
} from "@/components/dashboard/DashboardWidget";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { formatStockQuantity, stockDetailHref } from "@/components/stock/stock-utils";
import { StockStatusBadge } from "@/components/stock/stock-status-badge";
import { TargetProgressBar } from "@/components/targets/target-progress-bar";
import { ServiceRequestStatusBadge } from "@/components/service-requests/service-request-status-badge";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/lib/api/dashboard/types";
import { cn } from "@/lib/utils";
import { formatTargetDaysRemaining } from "@/lib/api/targets/target-progress-display";

type DashboardContentProps = {
  data: DashboardData;
};

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: tr });
  } catch {
    return "—";
  }
}

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

export function DashboardContent({ data }: DashboardContentProps) {
  const renewalPreview = data.renewalContracts.slice(0, LIST_PREVIEW_LIMIT);
  const stockPreview = data.stockAlerts.slice(0, LIST_PREVIEW_LIMIT);
  const recentPreview = data.recentServiceRequests.slice(0, LIST_PREVIEW_LIMIT);
  const targetsPreview = data.activeTargets.slice(0, LIST_PREVIEW_LIMIT);
  const todayPreview = data.todayServiceRequests.slice(0, LIST_PREVIEW_LIMIT);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hoş geldin, {data.userName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {data.isAdmin
            ? "Tüm şubelerin operasyon özeti"
            : data.branchLabel
              ? `${data.branchLabel} şube özeti`
              : "Operasyon özeti"}
        </p>
      </div>

      <DashboardSummaryCards summary={data.summary} />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <DashboardWidget
            title="Son Servis Talepleri"
            description="En son oluşturulan servis talepleri"
            icon={<Wrench className="size-4 text-orange-500" />}
            viewAllHref="/service-requests"
          >
            {data.recentServiceRequests.length === 0 ? (
              <DashboardEmptyState message="Henüz servis talebi yok — ilk talebi oluşturabilirsiniz" />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {recentPreview.map((serviceRequest) => (
                    <li key={serviceRequest.id}>
                      <Link
                        href={`/service-requests/${serviceRequest.id}`}
                        className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium">
                            {serviceRequest.request_number}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {serviceRequest.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(serviceRequest.created_at)}
                          </p>
                        </div>
                        <ServiceRequestStatusBadge
                          status={serviceRequest.status}
                          variant={serviceRequest.status_variant}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
                <DashboardListFooter
                  totalCount={data.recentServiceRequests.length}
                  href="/service-requests"
                />
              </>
            )}
          </DashboardWidget>

          <DashboardWidget
            title="Kritik / Düşük Stok Uyarıları"
            description="Kritik seviyeye yaklaşan veya altındaki ürünler"
            icon={<Package className="size-4 text-red-500" />}
            viewAllHref="/stock?status=critical"
          >
            {data.stockAlerts.length === 0 ? (
              <DashboardEmptyState message="Stok seviyeleri sağlıklı 🎉" />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {stockPreview.map((item) => (
                    <li key={`${item.part_id}:${item.branch_id}`}>
                      <Link
                        href={stockDetailHref(item.part_id, item.branch_id)}
                        className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium">
                            {item.part_code}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.branch_name}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StockStatusBadge
                            status={item.stock_status}
                            variant={
                              item.stock_status === "critical"
                                ? "destructive"
                                : "warning"
                            }
                            currentQuantity={item.current_quantity}
                          />
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {formatStockQuantity(item.current_quantity, item.unit)}{" "}
                            / kritik{" "}
                            {formatStockQuantity(item.min_stock, item.unit)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <DashboardListFooter
                  totalCount={data.stockAlerts.length}
                  href="/stock?status=critical"
                />
              </>
            )}
          </DashboardWidget>
        </div>

        <div className="space-y-3">
          <DashboardWidget
            title="Hedefler Özeti"
            description="Aktif hedeflerin güncel ilerleme durumu"
            icon={<Target className="size-4 text-violet-500" />}
            viewAllHref="/targets"
          >
            {data.activeTargets.length === 0 ? (
              <DashboardEmptyState message="Henüz hedef yok 🎯" />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {targetsPreview.map((target) => (
                    <li key={target.id}>
                      <Link
                        href={`/targets/${target.id}`}
                        className="-mx-2 block rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 font-medium">{target.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 tabular-nums",
                              target.days_remaining < 0
                                ? "border-border bg-muted text-muted-foreground"
                                : target.days_remaining <= 7
                                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                                  : "border-border bg-muted/50 text-muted-foreground",
                            )}
                          >
                            {formatTargetDaysRemaining(target.days_remaining)}
                          </Badge>
                        </div>
                        <div className="mt-1.5">
                          <TargetProgressBar
                            percentage={target.completion_percentage}
                            displayStatus={target.display_status}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <DashboardListFooter
                  totalCount={data.activeTargets.length}
                  href="/targets"
                />
              </>
            )}
          </DashboardWidget>

          <DashboardWidget
            title="Yenileme Gereken Sözleşmeler"
            description="90 gün ve altında bitiş tarihi olan sözleşmeler"
            icon={<FileText className="size-4 text-red-500" />}
            viewAllHref="/contracts?listFilter=renewal_near"
          >
            {data.renewalContracts.length === 0 ? (
              <DashboardEmptyState message="Tüm sözleşmeler sağlıklı 🎉" />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {renewalPreview.map((contract) => (
                    <li key={contract.id}>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium">
                            {contract.contract_number}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {contract.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bitiş: {formatDate(contract.end_date)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 tabular-nums",
                            contract.days_remaining <= 30
                              ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                              : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
                          )}
                        >
                          {contract.days_remaining} gün
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
                <DashboardListFooter
                  totalCount={data.renewalContracts.length}
                  href="/contracts?listFilter=renewal_near"
                />
              </>
            )}
          </DashboardWidget>
        </div>
      </div>

      <DashboardWidget
        title="Bugünün Servis Talepleri"
        description="Bugün oluşturulan veya güncellenen servis talepleri"
        icon={<CalendarDays className="size-4 text-blue-500" />}
        viewAllHref="/service-requests"
      >
        {data.todayServiceRequests.length === 0 ? (
          <DashboardEmptyState message="Bugün için servis talebi aktivitesi yok 🎉" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-1.5 pr-3 text-xs font-medium">Talep No</th>
                    <th className="pb-1.5 pr-3 text-xs font-medium">Firma</th>
                    <th className="pb-1.5 pr-3 text-xs font-medium">Teknisyen</th>
                    <th className="pb-1.5 pr-3 text-xs font-medium">Son İşlem</th>
                    <th className="pb-1.5 text-xs font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPreview.map((serviceRequest) => (
                    <tr
                      key={serviceRequest.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-2 pr-3">
                        <Link
                          href={`/service-requests/${serviceRequest.id}`}
                          className="font-mono font-medium hover:text-primary hover:underline"
                        >
                          {serviceRequest.request_number}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">{serviceRequest.company_name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {serviceRequest.assignee_name ?? "Atanmadı"}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">
                        {formatDateTime(serviceRequest.updated_at)}
                      </td>
                      <td className="py-2">
                        <ServiceRequestStatusBadge
                          status={serviceRequest.status}
                          variant={serviceRequest.status_variant}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DashboardListFooter
              totalCount={data.todayServiceRequests.length}
              href="/service-requests"
            />
          </>
        )}
      </DashboardWidget>
    </div>
  );
}
