"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DeleteConfirmCheckbox } from "@/components/shared/delete-confirm-checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  DeleteStockItemAction,
  GetStockItemDeletionImpactAction,
} from "@/lib/api/stock/types";
import { usePermissions } from "@/lib/hooks/use-permissions";

type DeleteStockItemButtonProps = {
  partId: string;
  partCode: string;
  deleteStockItemAction: DeleteStockItemAction;
  getDeletionImpactAction: GetStockItemDeletionImpactAction;
};

export function DeleteStockItemButton({
  partId,
  partCode,
  deleteStockItemAction,
  getDeletionImpactAction,
}: DeleteStockItemButtonProps) {
  const router = useRouter();
  const { canDelete, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [impact, setImpact] = useState({
    movementCount: 0,
    workOrderPartCount: 0,
    branchStockCount: 0,
  });
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setImpactLoading(true);

    getDeletionImpactAction(partId)
      .then((data) => {
        if (!cancelled) {
          setImpact(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Silme uyarıları yüklenemedi");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setImpactLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, partId, getDeletionImpactAction]);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  async function handleDelete() {
    if (!confirmed) return;

    setLoading(true);
    const result = await deleteStockItemAction(partId);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (result.data.hadMovements) {
      toast.message("Ürün silindi", {
        description: "Geçmiş stok hareketleri kayıtlarda kalmaya devam eder.",
      });
    } else {
      toast.success("Stok ürünü silindi");
    }

    setOpen(false);
    router.push("/stock");
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-destructive hover:text-destructive"
        onClick={() => {
          setConfirmed(false);
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" />
        Sil
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stok ürününü sil</DialogTitle>
            <DialogDescription>
              {partCode} kodlu ürün kalıcı olarak arşivlenecek. Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-28 space-y-3">
            {impactLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                İlişkili kayıtlar kontrol ediliyor…
              </div>
            ) : (
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>{impact.movementCount} stok hareketi</li>
                <li>{impact.workOrderPartCount} iş emri kullanımı</li>
                <li>{impact.branchStockCount} şube stok tanımı</li>
              </ul>
            )}

            {impact.movementCount > 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bu ürünün {impact.movementCount} hareketi var, silmek istediğine
                emin misin? Silme işlemi ürün kartını gizler; hareket geçmişi
                korunur.
              </p>
            ) : null}
          </div>

          <DeleteConfirmCheckbox
            id="confirm-delete-stock"
            checked={confirmed}
            onCheckedChange={setConfirmed}
            label="Silme işlemini onaylıyorum"
            disabled={loading || impactLoading}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!confirmed || loading || impactLoading}
              onClick={() => void handleDelete()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Siliniyor…
                </>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
