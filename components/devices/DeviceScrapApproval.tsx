"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
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
import { approveScrap } from "@/lib/api/devices/approve-scrap";
import { rejectScrap } from "@/lib/api/devices/reject-scrap";
import type { DeviceDetail } from "@/lib/api/devices/types";
import {
  DEVICE_SCRAP_NEXT_STEP_LABELS,
  DEVICE_SCRAP_REASON_LABELS,
} from "@/lib/constants/device-scrap";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "flex min-h-[88px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type DeviceScrapApprovalProps = {
  device: DeviceDetail;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

export function DeviceScrapApproval({ device }: DeviceScrapApprovalProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  if (device.scrap_status !== "pending_approval") {
    return null;
  }

  const reasonLabel = device.scrap_reason
    ? DEVICE_SCRAP_REASON_LABELS[device.scrap_reason]
    : "—";

  const nextStepLabel = device.scrap_next_step
    ? DEVICE_SCRAP_NEXT_STEP_LABELS[device.scrap_next_step]
    : null;

  async function handleApprove() {
    setIsApproving(true);
    try {
      const result = await approveScrap(device.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Hek talebi onaylandı");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      toast.error("Red nedeni gereklidir");
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectScrap(device.id, trimmed);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Hek talebi reddedildi");
      setRejectOpen(false);
      setRejectReason("");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-amber-300/80 bg-amber-50 p-4 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">⚠️ Bu cihaz için hek onayı bekleniyor</p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div>
            <span className="text-amber-800/80 dark:text-amber-200/80">
              Teknisyen:{" "}
            </span>
            <span className="font-medium">
              {device.scrapped_by_name ?? "—"}
            </span>
          </div>
          <div>
            <span className="text-amber-800/80 dark:text-amber-200/80">
              Neden:{" "}
            </span>
            <span className="font-medium">{reasonLabel}</span>
          </div>
          <div>
            <span className="text-amber-800/80 dark:text-amber-200/80">
              Açıklama:{" "}
            </span>
            <span className="font-medium">{device.scrap_notes ?? "—"}</span>
          </div>
          {nextStepLabel ? (
            <div>
              <span className="text-amber-800/80 dark:text-amber-200/80">
                Teknisyen önerisi:{" "}
              </span>
              <span className="font-medium">{nextStepLabel}</span>
            </div>
          ) : null}
          <div>
            <span className="text-amber-800/80 dark:text-amber-200/80">
              Tarih:{" "}
            </span>
            <span className="font-medium">
              {formatDateTime(device.scrapped_at)}
            </span>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isApproving || isRejecting}
            onClick={() => void handleApprove()}
          >
            {isApproving ? "Onaylanıyor…" : "✓ Onayla"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isApproving || isRejecting}
            onClick={() => setRejectOpen(true)}
          >
            ✗ Reddet
          </Button>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hek talebini reddet</DialogTitle>
            <DialogDescription>
              Teknisyene iletilecek red nedenini yazın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="scrap-reject-reason" className="text-sm font-medium">
              Red nedeni *
            </label>
            <textarea
              id="scrap-reject-reason"
              className={textareaClassName}
              rows={4}
              value={rejectReason}
              disabled={isRejecting}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Red nedenini açıklayın…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isRejecting}
              onClick={() => setRejectOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isRejecting}
              onClick={() => void handleReject()}
            >
              {isRejecting ? "Reddediliyor…" : "Reddet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
