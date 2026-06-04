"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import type {
  ExportCustomersAction,
  ExportCustomersFormat,
} from "@/lib/api/customers/types";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { downloadBase64File } from "@/lib/utils/download-base64";
import type { CustomerFilterInput } from "@/schemas/customer";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type ExportCustomersButtonProps = {
  filters: CustomerFilterInput;
  exportAction: ExportCustomersAction;
};

export function ExportCustomersButton({
  filters,
  exportAction,
}: ExportCustomersButtonProps) {
  const { canExport, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportCustomersFormat>("xlsx");
  const [confirmed, setConfirmed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (permissionsLoading || !canExport) {
    return null;
  }

  async function handleExport() {
    if (!confirmed) {
      toast.error("KVKK onayını işaretleyin");
      return;
    }

    setIsExporting(true);

    try {
      const result = await exportAction(filters, format);

      if (!result.success) {
        toast.error(result.error ?? "Dışa aktarma başarısız");
        return;
      }

      downloadBase64File(
        result.data.contentBase64,
        result.data.filename,
        result.data.mimeType,
      );

      toast.success(
        `${result.data.recordCount} müşteri ${format === "xlsx" ? "Excel" : "CSV"} olarak indirildi`,
      );
      setOpen(false);
      setConfirmed(false);
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Download className="size-4" />
        Dışa Aktar
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setConfirmed(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri listesini dışa aktar</DialogTitle>
            <DialogDescription>
              Aktif filtreler uygulanarak dışa aktarılır. İşlem KVKK kayıtlarına
              yazılır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="export-format">Format</FieldLabel>
              <select
                id="export-format"
                className={selectClassName}
                value={format}
                onChange={(e) =>
                  setFormat(e.target.value as ExportCustomersFormat)
                }
                disabled={isExporting}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </Field>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Bu işlem kişisel veri içerir. KVKK uyumluluğu için sadece yetkili
              kullanım.
            </div>

            <Field orientation="horizontal">
              <Checkbox
                id="export-kvkk"
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                disabled={isExporting}
              />
              <FieldLabel htmlFor="export-kvkk" className="font-normal">
                Onaylıyorum
              </FieldLabel>
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isExporting}
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              disabled={!confirmed || isExporting}
              onClick={handleExport}
              className="gap-1.5"
            >
              {isExporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Hazırlanıyor…
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  İndir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
