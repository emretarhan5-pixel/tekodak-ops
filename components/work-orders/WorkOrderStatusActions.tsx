"use client";

import { Loader2, Play, Square, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getAvailableStatusActions } from "@/lib/api/work-orders/work-order-status-actions";
import type { UpdateWorkOrderStatusAction } from "@/lib/api/work-orders/types";
import type { WorkOrderStatus } from "@/lib/constants/work-order";

type WorkOrderStatusActionsProps = {
  workOrderId: string;
  status: WorkOrderStatus;
  assignedTo: string | null;
  enabled: boolean;
  updateStatusAction: UpdateWorkOrderStatusAction;
};

export function WorkOrderStatusActions({
  workOrderId,
  status,
  assignedTo,
  enabled,
  updateStatusAction,
}: WorkOrderStatusActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<
    "start" | "complete" | "cancel" | null
  >(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (!enabled) {
    return null;
  }

  const actions = getAvailableStatusActions(status, Boolean(assignedTo));

  if (actions.length === 0) {
    return null;
  }

  async function runAction(
    action: "start" | "complete" | "cancel",
    reason?: string,
  ) {
    setLoadingAction(action);

    try {
      const result = await updateStatusAction(
        workOrderId,
        action,
        reason ?? null,
      );

      if (!result.success) {
        toast.error(result.error ?? "Durum güncellenemedi");
        return;
      }

      const messages = {
        start: "İş emri başlatıldı",
        complete: "İş emri tamamlandı",
        cancel: "İş emri iptal edildi",
      };
      toast.success(messages[action]);
      setCancelOpen(false);
      setCancelReason("");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.includes("start") ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={loadingAction !== null}
            onClick={() => runAction("start")}
          >
            {loadingAction === "start" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Başlat
          </Button>
        ) : null}

        {actions.includes("complete") ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5"
            disabled={loadingAction !== null}
            onClick={() => runAction("complete")}
          >
            {loadingAction === "complete" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Square className="size-4" />
            )}
            Tamamla
          </Button>
        ) : null}

        {actions.includes("cancel") ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={loadingAction !== null}
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="size-4" />
            İptal Et
          </Button>
        ) : null}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İş emrini iptal et</DialogTitle>
            <DialogDescription>
              İptal gerekçesi kayıt altına alınır. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="cancel-reason">İptal gerekçesi *</FieldLabel>
            <Input
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Örn. müşteri talebi, parça bekleniyor…"
              disabled={loadingAction === "cancel"}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={loadingAction === "cancel"}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!cancelReason.trim() || loadingAction === "cancel"}
              onClick={() => runAction("cancel", cancelReason)}
            >
              {loadingAction === "cancel" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  İptal ediliyor…
                </>
              ) : (
                "İptal et"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
