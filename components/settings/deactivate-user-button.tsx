"use client";

import { Loader2 } from "lucide-react";
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
import type {
  DeactivateUserAction,
  GetOpenWorkOrdersAction,
  UserListItem,
} from "@/lib/api/users/types";

type DeactivateUserButtonProps = {
  user: UserListItem;
  disabled?: boolean;
  deactivateUserAction: DeactivateUserAction;
  getOpenWorkOrdersAction: GetOpenWorkOrdersAction;
};

export function DeactivateUserButton({
  user,
  disabled,
  deactivateUserAction,
  getOpenWorkOrdersAction,
}: DeactivateUserButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [openWorkOrders, setOpenWorkOrders] = useState<number | null>(null);

  async function handleOpen() {
    setOpen(true);
    setChecking(true);
    setOpenWorkOrders(null);

    try {
      const count = await getOpenWorkOrdersAction(user.id);
      setOpenWorkOrders(count);
    } catch {
      toast.error("İş emri kontrolü yapılamadı");
      setOpen(false);
    } finally {
      setChecking(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);

    try {
      const result = await deactivateUserAction(user.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const count = result.data.openWorkOrders;
      if (count > 0) {
        toast.success(
          `Kullanıcı pasifleştirildi. ${count} açık iş emri yeniden atanmalı.`,
        );
      } else {
        toast.success("Kullanıcı pasifleştirildi");
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (!user.is_active) {
    return (
      <span className="text-xs text-muted-foreground">Zaten pasif</span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 text-destructive hover:text-destructive"
        disabled={disabled}
        onClick={handleOpen}
      >
        Pasifleştir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı pasifleştir</DialogTitle>
            <DialogDescription>
              <strong>{user.full_name}</strong> hesabı devre dışı bırakılacak ve
              giriş yapamayacak.
            </DialogDescription>
          </DialogHeader>

          {checking ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Açık iş emirleri kontrol ediliyor…
            </div>
          ) : openWorkOrders !== null && openWorkOrders > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Bu kullanıcıya atanmış{" "}
              <strong>{openWorkOrders}</strong> açık iş emri var. Pasifleştirmeden
              önce iş emirlerini başka personele atamanız önerilir.
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Açık iş emri bulunmuyor.
            </p>
          )}

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
              disabled={loading || checking}
              onClick={handleConfirm}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Pasifleştiriliyor…
                </>
              ) : (
                "Evet, pasifleştir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
