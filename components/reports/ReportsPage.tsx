"use client";

import { Suspense, useTransition, type ReactNode } from "react";

import {
  BarChart3,
  ClipboardList,
  FileText,
  Package,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ContractReport } from "@/components/reports/ContractReport";
import { CustomerReport } from "@/components/reports/CustomerReport";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { StockReport } from "@/components/reports/StockReport";
import { WorkOrderReport } from "@/components/reports/WorkOrderReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ReportFilterOptions,
  ReportPageData,
} from "@/lib/api/reports/types";
import {
  REPORT_TYPE_LABELS,
  REPORT_TYPES,
  type ReportType,
} from "@/lib/constants/report";
import type { ReportFilterInput } from "@/schemas/report";

const REPORT_ICONS: Record<ReportType, ReactNode> = {
  contracts: <FileText className="size-4" />,
  work_orders: <ClipboardList className="size-4" />,
  stock: <Package className="size-4" />,
  customers: <Users className="size-4" />,
};

type ReportsPageProps = {
  reportData: ReportPageData;
  filterOptions: ReportFilterOptions;
  filters: ReportFilterInput;
  showBranchFilter: boolean;
  staffBranchLabel?: string;
};

export function ReportsPage({
  reportData,
  filterOptions,
  filters,
  showBranchFilter,
  staffBranchLabel,
}: ReportsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleTabChange(nextType: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("type", nextType);
    startTransition(() => {
      router.push(`${pathname ?? "/"}?${next.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Operasyon verilerini dönem ve şube bazında inceleyin
          </p>
        </div>
      </div>

      <Tabs value={filters.type} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          {REPORT_TYPES.map((type) => (
            <TabsTrigger key={type} value={type} disabled={isPending}>
              {REPORT_ICONS[type]}
              {REPORT_TYPE_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>

        <Suspense fallback={null}>
          <ReportFilters
            filters={filters}
            filterOptions={filterOptions}
            showBranchFilter={showBranchFilter}
            staffBranchLabel={staffBranchLabel}
            showPeriodFilter
          />
        </Suspense>

        {reportData.type === "contracts" ? (
          <TabsContent value="contracts" className="mt-0">
            <ContractReport data={reportData.data} filters={filters} />
          </TabsContent>
        ) : null}
        {reportData.type === "work_orders" ? (
          <TabsContent value="work_orders" className="mt-0">
            <WorkOrderReport data={reportData.data} filters={filters} />
          </TabsContent>
        ) : null}
        {reportData.type === "stock" ? (
          <TabsContent value="stock" className="mt-0">
            <StockReport data={reportData.data} filters={filters} />
          </TabsContent>
        ) : null}
        {reportData.type === "customers" ? (
          <TabsContent value="customers" className="mt-0">
            <CustomerReport data={reportData.data} filters={filters} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
