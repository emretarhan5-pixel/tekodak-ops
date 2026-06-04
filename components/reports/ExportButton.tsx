"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportContractReport } from "@/lib/api/reports/export-contract-report";
import { exportCustomerReport } from "@/lib/api/reports/export-customer-report";
import { exportStockReport } from "@/lib/api/reports/export-stock-report";
import { exportWorkOrderReport } from "@/lib/api/reports/export-work-order-report";
import type { ReportType } from "@/lib/constants/report";
import { downloadBase64File } from "@/lib/utils/download-base64";
import type { ReportFilterInput } from "@/schemas/report";

type ExportButtonProps = {
  reportType: ReportType;
  filters: ReportFilterInput;
};

const EXPORT_ACTIONS = {
  contracts: exportContractReport,
  work_orders: exportWorkOrderReport,
  stock: exportStockReport,
  customers: exportCustomerReport,
} as const;

export function ExportButton({ reportType, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);

    try {
      const result = await EXPORT_ACTIONS[reportType](filters);

      if (!result.success) {
        toast.error(result.error ?? "Dışa aktarma başarısız");
        return;
      }

      downloadBase64File(
        result.data.contentBase64,
        result.data.filename,
        result.data.mimeType,
      );

      toast.success(`${result.data.recordCount} kayıt CSV olarak indirildi`);
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={loading}
      onClick={() => void handleExport()}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Dışa Aktar
    </Button>
  );
}
