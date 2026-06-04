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
  DeleteDeviceAction,
  GetDeviceDeletionImpactAction,
} from "@/lib/api/devices/types";
import { usePermissions } from "@/lib/hooks/use-permissions";

type DeleteDeviceButtonProps = {
  deviceId: string;
  serialNumber: string;
  openWorkOrders?: number;
  deleteDeviceAction: DeleteDeviceAction;
  getDeletionImpactAction: GetDeviceDeletionImpactAction;
};

export function DeleteDeviceButton({
  deviceId,
  serialNumber,
  openWorkOrders: initialOpenWorkOrders,
  deleteDeviceAction,
  getDeletionImpactAction,
}: DeleteDeviceButtonProps) {
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

    getDeletionImpactAction(deviceId)
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
  }, [open, deviceId, initialOpenWorkOrders, getDeletionImpactAction]);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  async function handleDelete() {
    if (!confirmed) {
      toast.error("Onay kutusunu işaretleyin");
      return;
    }

    setLoading(true);

    try {
      const result = await deleteDeviceAction(deviceId);

      if (!result.success) {
        toast.error(result.error ?? "Cihaz silinemedi");
        return;
      }

      toast.success("Cihaz silindi");
      setOpen(false);
      router.push("/devices");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
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
            <DialogTitle>Cihazı sil</DialogTitle>
            <DialogDescription>
              {serialNumber} kaydı soft delete ile kaldırılır. Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>

          {impactLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              İlişkili kayıtlar kontrol ediliyor…
            </p>
          ) : openWorkOrders > 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Bu cihaza bağlı {openWorkOrders} açık iş emri var; silme işlemi
              bu kayıtları da etkileyebilir.
            </p>
          ) : null}

          <DeleteConfirmCheckbox
            id="confirm-device-delete"
            checked={confirmed}
            onCheckedChange={setConfirmed}
            label="Bu cihazı silmek istediğimi onaylıyorum"
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
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
