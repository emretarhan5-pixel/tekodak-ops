"use client";

import { Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  CancelTargetAction,
  DeleteTargetAction,
} from "@/lib/api/targets/types";
import { usePermissions } from "@/lib/hooks/use-permissions";

type DeleteTargetButtonProps = {
  targetId: string;
  targetName: string;
  deleteTargetAction: DeleteTargetAction;
};

export function DeleteTargetButton({
  targetId,
  targetName,
  deleteTargetAction,
}: DeleteTargetButtonProps) {
  const router = useRouter();
  const { canDelete, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  async function handleDelete() {
    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await deleteTargetAction(targetId);

      if (!result.success) {
        toast.error(result.error ?? "Hedef silinemedi");
        return;
      }

      toast.success("Hedef silindi");
      router.push("/targets");
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
        🗑️ Sil
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
            <DialogTitle>Hedefi silmek istediğine emin misin?</DialogTitle>
            <DialogDescription>
              {targetName} hedefi iptal edilecek ve listede &quot;İptal&quot;
              olarak görünecek.
            </DialogDescription>
          </DialogHeader>

          <DeleteConfirmCheckbox
            id="confirm-delete-target"
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
              İptal
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
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type CancelTargetButtonProps = {
  targetId: string;
  targetName: string;
  cancelTargetAction: CancelTargetAction;
};

export function CancelTargetButton({
  targetId,
  targetName,
  cancelTargetAction,
}: CancelTargetButtonProps) {
  const router = useRouter();
  const { canDelete, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  async function handleCancel() {
    setLoading(true);

    try {
      const result = await cancelTargetAction(targetId);

      if (!result.success) {
        toast.error(result.error ?? "Hedef iptal edilemedi");
        return;
      }

      toast.success("Hedef iptal edildi");
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
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Ban className="size-4" />
        İptal Et
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hedefi iptal et</DialogTitle>
            <DialogDescription>
              Bu hedefi iptal etmek istediğine emin misin? {targetName} hedefi
              iptal edilecek ve ilerleme takibi durdurulacak.
            </DialogDescription>
          </DialogHeader>

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
              disabled={loading}
              onClick={handleCancel}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  İptal ediliyor…
                </>
              ) : (
                "İptal Et"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
