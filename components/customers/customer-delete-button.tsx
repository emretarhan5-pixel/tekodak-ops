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
  DeleteCustomerAction,
  GetCustomerDeletionImpactAction,
} from "@/lib/api/customers/types";
import { usePermissions } from "@/lib/hooks/use-permissions";

type CustomerDeleteButtonProps = {
  customerId: string;
  customerName: string;
  activeContracts?: number;
  openWorkOrders?: number;
  deleteCustomerAction: DeleteCustomerAction;
  getDeletionImpactAction: GetCustomerDeletionImpactAction;
};

export function CustomerDeleteButton({
  customerId,
  customerName,
  activeContracts: initialContracts,
  openWorkOrders: initialWorkOrders,
  deleteCustomerAction,
  getDeletionImpactAction,
}: CustomerDeleteButtonProps) {
  const router = useRouter();
  const { canDelete, isLoading: permissionsLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [activeContracts, setActiveContracts] = useState(initialContracts ?? 0);
  const [openWorkOrders, setOpenWorkOrders] = useState(initialWorkOrders ?? 0);
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (
      initialContracts !== undefined &&
      initialWorkOrders !== undefined
    ) {
      setActiveContracts(initialContracts);
      setOpenWorkOrders(initialWorkOrders);
      return;
    }

    let cancelled = false;
    setImpactLoading(true);

    getDeletionImpactAction(customerId)
      .then((impact) => {
        if (!cancelled) {
          setActiveContracts(impact.activeContracts);
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
  }, [
    open,
    customerId,
    initialContracts,
    initialWorkOrders,
    getDeletionImpactAction,
  ]);

  if (permissionsLoading || !canDelete) {
    return null;
  }

  const hasImpact = activeContracts > 0 || openWorkOrders > 0;

  async function handleConfirm() {
    if (!confirmed) {
      toast.error("Onay kutusunu işaretleyin");
      return;
    }

    setLoading(true);

    try {
      const result = await deleteCustomerAction(customerId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Müşteri silindi");
      setOpen(false);
      router.push("/customers");
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
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        Müşteriyi Sil
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
            <DialogTitle>Müşteriyi Sil</DialogTitle>
            <DialogDescription>
              {customerName} müşterisini silmek üzeresiniz. Kayıt soft delete ile
              kaldırılır; 30 gün sonra kalıcı silme işlemi yapılabilir.
            </DialogDescription>
          </DialogHeader>

          {impactLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              İlişkili kayıtlar kontrol ediliyor…
            </p>
          ) : hasImpact ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              ⚠️ {activeContracts} aktif sözleşme ve {openWorkOrders} açık iş var;
              bunlar da etkilenecek.
            </p>
          ) : null}

          <DeleteConfirmCheckbox
            id="delete-confirm"
            checked={confirmed}
            onCheckedChange={setConfirmed}
            label="Onaylıyorum"
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
              disabled={loading || !confirmed}
              onClick={handleConfirm}
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
