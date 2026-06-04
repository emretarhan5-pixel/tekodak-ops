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
  DeleteContractAction,
  GetContractDeletionImpactAction,
} from "@/lib/api/contracts/types";
import { usePermissions } from "@/lib/hooks/use-permissions";

type DeleteContractButtonProps = {
  contractId: string;
  contractNumber: string;
  openWorkOrders?: number;
  deleteContractAction: DeleteContractAction;
  getDeletionImpactAction: GetContractDeletionImpactAction;
};

export function DeleteContractButton({
  contractId,
  contractNumber,
  openWorkOrders: initialOpenWorkOrders,
  deleteContractAction,
  getDeletionImpactAction,
}: DeleteContractButtonProps) {
  const router = useRouter();
  const { canDelete, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [openWorkOrders, setOpenWorkOrders] = useState(
    initialOpenWorkOrders ?? 0,
  );
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (initialOpenWorkOrders !== undefined) {
      setOpenWorkOrders(initialOpenWorkOrders);
      return;
    }

    let cancelled = false;
    setImpactLoading(true);

    getDeletionImpactAction(contractId)
      .then((impact) => {
        if (!cancelled) {
          setOpenWorkOrders(impact.openWorkOrders);
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
  }, [open, contractId, initialOpenWorkOrders, getDeletionImpactAction]);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  const hasImpact = openWorkOrders > 0;

  async function handleDelete() {
    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await deleteContractAction(contractId);

      if (!result.success) {
        toast.error(result.error ?? "Sözleşme silinemedi");
        return;
      }

      toast.success("Sözleşme silindi");
      router.push("/contracts");
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
            <DialogTitle>Sözleşmeyi sil</DialogTitle>
            <DialogDescription>
              {contractNumber} kaydı silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          {impactLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Bağlı kayıtlar kontrol ediliyor…
            </p>
          ) : hasImpact ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
              {openWorkOrders > 0 ? (
                <li>{openWorkOrders} açık iş emri bağlı</li>
              ) : null}
            </ul>
          ) : null}

          <DeleteConfirmCheckbox
            id="confirm-delete-contract"
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
