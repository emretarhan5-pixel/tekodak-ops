"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  FileText,
  Package,
  Target,
} from "lucide-react";
import Link from "next/link";

import { DashboardEmptyState } from "@/components/dashboard/DashboardWidget";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { formatStockQuantity, stockDetailHref } from "@/components/stock/stock-utils";
import { StockStatusBadge } from "@/components/stock/stock-status-badge";
import { TargetProgressBar } from "@/components/targets/target-progress-bar";
import { WorkOrderStatusBadge } from "@/components/work-orders/work-order-status-badge";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/lib/api/dashboard/types";
import { getWorkOrderStatusVariant } from "@/lib/api/work-orders/work-order-status";
import {
  CONTRACT_LIST_FILTER_LABELS,
  type ContractListFilter,
} from "@/lib/constants/contract";
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

const CONTRACT_SUMMARY_ITEMS: {
  key: keyof DashboardData["contractStatusSummary"];
  filter: ContractListFilter;
  barClassName: string;
}[] = [
  {
    key: "active",
    filter: "active",
    barClassName: "bg-emerald-500",
  },
  {
    key: "renewalNear",
    filter: "renewal_near",
    barClassName: "bg-amber-500",
  },
  {
    key: "ended",
    filter: "ended",
    barClassName: "bg-slate-400",
  },
  {
    key: "draft",
    filter: "draft",
    barClassName: "bg-blue-400",
  },
];

export function DashboardContent({ data }: DashboardContentProps) {
  const contractSummaryTotal = Object.values(data.contractStatusSummary).reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hoş geldin, {data.userName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {data.isAdmin
            ? "Tüm şubelerin operasyon özeti"
            : data.branchLabel
              ? `${data.branchLabel} şube özeti`
              : "Operasyon özeti"}
        </p>
      </div>

      <DashboardSummaryCards summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardWidget
          title="Yenileme Gereken Sözleşmeler"
          description="90 gün ve altında bitiş tarihi olan sözleşmeler"
          icon={<FileText className="size-4 text-red-500" />}
          viewAllHref="/contracts?listFilter=renewal_near"
        >
          {data.renewalContracts.length === 0 ? (
            <DashboardEmptyState message="Tüm sözleşmeler sağlıklı 🎉" />
          ) : (
            <ul className="divide-y divide-border">
              {data.renewalContracts.map((contract) => (
                <li key={contract.id}>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-lg"
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
          )}
        </DashboardWidget>

        <DashboardWidget
          title="Son İş Emirleri"
          description="En son oluşturulan 5 iş emri"
          icon={<ClipboardList className="size-4 text-amber-500" />}
          viewAllHref="/work-orders"
        >
          {data.recentWorkOrders.length === 0 ? (
            <DashboardEmptyState message="Henüz iş emri kaydı yok — ilk işi oluşturabilirsiniz" />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentWorkOrders.map((workOrder) => (
                <li key={workOrder.id}>
                  <Link
                    href={`/work-orders/${workOrder.id}`}
                    className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">
                        {workOrder.work_order_number}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {workOrder.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(workOrder.created_at)}
                      </p>
                    </div>
                    <WorkOrderStatusBadge
                      status={workOrder.status}
                      variant={getWorkOrderStatusVariant(workOrder.status)}
                    />
                  </Link>
                </li>
              ))}
            </ul>
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
            <ul className="divide-y divide-border">
              {data.stockAlerts.map((item) => (
                <li key={`${item.part_id}:${item.branch_id}`}>
                  <Link
                    href={stockDetailHref(item.part_id, item.branch_id)}
                    className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-lg"
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
          )}
        </DashboardWidget>

        <DashboardWidget
          title="Hedefler Özeti"
          description="Aktif hedeflerin güncel ilerleme durumu"
          icon={<Target className="size-4 text-violet-500" />}
          viewAllHref="/targets"
        >
          {data.activeTargets.length === 0 ? (
            <DashboardEmptyState message="Henüz hedef yok 🎯" />
          ) : (
            <ul className="divide-y divide-border">
              {data.activeTargets.map((target) => (
                <li key={target.id}>
                  <Link
                    href={`/targets/${target.id}`}
                    className="block py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-lg"
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
                    <div className="mt-2">
                      <TargetProgressBar
                        percentage={target.completion_percentage}
                        displayStatus={target.display_status}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget
          title="Sözleşme Durumu Özeti"
          description="Duruma göre sözleşme dağılımı"
          icon={<AlertTriangle className="size-4 text-emerald-500" />}
          viewAllHref="/contracts"
        >
          {contractSummaryTotal === 0 ? (
            <DashboardEmptyState message="Sözleşme portföyü henüz boş — ilk sözleşmeyi ekleyebilirsiniz" />
          ) : (
            <div className="space-y-4">
              {CONTRACT_SUMMARY_ITEMS.map(({ key, filter, barClassName }) => {
                const count = data.contractStatusSummary[key];
                const percent =
                  contractSummaryTotal > 0
                    ? Math.round((count / contractSummaryTotal) * 100)
                    : 0;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <Link
                        href={`/contracts?listFilter=${filter}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {CONTRACT_LIST_FILTER_LABELS[filter]}
                      </Link>
                      <span className="tabular-nums text-muted-foreground">
                        {count.toLocaleString("tr-TR")} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", barClassName)}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardWidget>
      </div>

      <DashboardWidget
        title="Bugünün İş Emirleri"
        description="Bugün planlanan veya devam eden iş emirleri"
        icon={<CalendarDays className="size-4 text-blue-500" />}
        viewAllHref="/work-orders"
      >
        {data.todayWorkOrders.length === 0 ? (
          <DashboardEmptyState message="Bugün için planlı iş yok — ekip hazır 🎉" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">İş Emri</th>
                  <th className="pb-2 pr-3 font-medium">Müşteri</th>
                  <th className="pb-2 pr-3 font-medium">Atanan</th>
                  <th className="pb-2 pr-3 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {data.todayWorkOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-3 pr-3">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="font-mono font-medium hover:text-primary hover:underline"
                      >
                        {workOrder.work_order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">{workOrder.customer_name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {workOrder.assignee_name ?? "Atanmadı"}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                      {workOrder.scheduled_date
                        ? formatDate(workOrder.scheduled_date)
                        : "—"}
                    </td>
                    <td className="py-3">
                      <WorkOrderStatusBadge
                        status={workOrder.status}
                        variant={getWorkOrderStatusVariant(workOrder.status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardWidget>
    </div>
  );
}
