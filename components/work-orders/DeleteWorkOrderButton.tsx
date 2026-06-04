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
  DeleteWorkOrderAction,
  GetWorkOrderDeletionImpactAction,
} from "@/lib/api/work-orders/types";
import { usePermissions } from "@/lib/hooks/use-permissions";

type DeleteWorkOrderButtonProps = {
  workOrderId: string;
  workOrderNumber: string;
  deleteWorkOrderAction: DeleteWorkOrderAction;
  getDeletionImpactAction: GetWorkOrderDeletionImpactAction;
};

export function DeleteWorkOrderButton({
  workOrderId,
  workOrderNumber,
  deleteWorkOrderAction,
  getDeletionImpactAction,
}: DeleteWorkOrderButtonProps) {
  const router = useRouter();
  const { canDelete, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [impact, setImpact] = useState({
    activityCount: 0,
    partCount: 0,
    photoCount: 0,
    fileCount: 0,
  });
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setImpactLoading(true);

    getDeletionImpactAction(workOrderId)
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
  }, [open, workOrderId, getDeletionImpactAction]);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  const relatedTotal =
    impact.activityCount +
    impact.partCount +
    impact.photoCount +
    impact.fileCount;

  async function handleDelete() {
    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await deleteWorkOrderAction(workOrderId);

      if (!result.success) {
        toast.error(result.error ?? "İş emri silinemedi");
        return;
      }

      toast.success("İş emri silindi");
      router.push("/work-orders");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
            <DialogTitle>İş emrini sil</DialogTitle>
            <DialogDescription>
              {workOrderNumber} kaydı silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          {impactLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Bağlı kayıtlar kontrol ediliyor…
            </p>
          ) : relatedTotal > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
              {impact.activityCount > 0 ? (
                <li>{impact.activityCount} aktivite kaydı</li>
              ) : null}
              {impact.partCount > 0 ? (
                <li>{impact.partCount} parça kullanımı</li>
              ) : null}
              {impact.photoCount > 0 ? (
                <li>{impact.photoCount} fotoğraf</li>
              ) : null}
              {impact.fileCount > 0 ? (
                <li>{impact.fileCount} dosya</li>
              ) : null}
            </ul>
          ) : null}

          <DeleteConfirmCheckbox
            id="confirm-delete-work-order"
            checked={confirmed}
            onCheckedChange={setConfirmed}
            label="Silmek istediğimi onaylıyorum"
            disabled={loading}
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
              disabled={!confirmed || loading}
              onClick={handleDelete}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Siliniyor…
                </>
              ) : (
                "Kalıcı olarak sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
