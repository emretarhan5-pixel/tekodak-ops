import Link from "next/link";
import { FileText, Package, Users, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/api/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardSummaryCardsProps = {
  summary: DashboardSummary;
};

const CARDS = [
  {
    key: "activeCustomers" as const,
    label: "Toplam Müşteri",
    href: "/customers",
    icon: Users,
    iconClassName: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "activeContracts" as const,
    label: "Aktif Sözleşme",
    href: "/contracts?listFilter=active",
    icon: FileText,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "openServiceRequests" as const,
    label: "Açık Servis Talebi",
    href: "/service-requests",
    icon: Wrench,
    iconClassName: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "criticalStockCount" as const,
    label: "Kritik Stok",
    href: "/stock?status=critical",
    icon: Package,
    iconClassName: "text-red-600 dark:text-red-400",
  },
] as const;

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ key, label, href, icon: Icon, iconClassName }) => (
        <Link key={key} href={href} className="group block">
          <Card className="shadow-xs transition-colors group-hover:border-primary/30">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className={cn("size-5", iconClassName)} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums">
                  {summary[key].toLocaleString("tr-TR")}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
