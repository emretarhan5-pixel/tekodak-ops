"use client";

import {
  Loader2,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import type {
  ActivateUserAction,
  DeactivateUserAction,
  DeleteUserAction,
  GetUserOpenTasksAction,
  UserListItem,
  UserOpenTasks,
} from "@/lib/api/users/types";
import { USER_ROLES } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type PendingAction = "deactivate" | "delete";

type DialogStep = "checking" | "reassign" | "delete_confirm";

type UserRowActionsProps = {
  user: UserListItem;
  users: UserListItem[];
  disabled?: boolean;
  onEdit: () => void;
  deactivateUserAction: DeactivateUserAction;
  activateUserAction: ActivateUserAction;
  deleteUserAction: DeleteUserAction;
  getUserOpenTasksAction: GetUserOpenTasksAction;
};

function totalOpenTasks(tasks: UserOpenTasks): number {
  return tasks.openServiceRequests + tasks.openMaintenancePlans;
}

export function UserRowActions({
  user,
  users,
  disabled,
  onEdit,
  deactivateUserAction,
  activateUserAction,
  deleteUserAction,
  getUserOpenTasksAction,
}: UserRowActionsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("checking");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [openTasks, setOpenTasks] = useState<UserOpenTasks | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [loading, setLoading] = useState(false);

  const staffOptions = useMemo(
    () =>
      users.filter(
        (candidate) =>
          candidate.id !== user.id &&
          candidate.role === USER_ROLES.STAFF &&
          candidate.is_active,
      ),
    [user.id, users],
  );

  function resetDialog() {
    setDialogOpen(false);
    setDialogStep("checking");
    setPendingAction(null);
    setOpenTasks(null);
    setSelectedTechnicianId("");
    setLoading(false);
  }

  async function beginAction(action: PendingAction) {
    setPendingAction(action);
    setDialogOpen(true);
    setDialogStep("checking");
    setOpenTasks(null);
    setSelectedTechnicianId("");
    setLoading(true);

    let delegatedToAction = false;

    try {
      const tasks = await getUserOpenTasksAction(user.id);
      setOpenTasks(tasks);

      if (totalOpenTasks(tasks) > 0) {
        setDialogStep("reassign");
        return;
      }

      if (action === "deactivate") {
        delegatedToAction = true;
        setLoading(false);
        await runDeactivate();
        return;
      }

      setDialogStep("delete_confirm");
    } catch {
      toast.error("Açık görevler kontrol edilemedi");
      resetDialog();
    } finally {
      if (!delegatedToAction) {
        setLoading(false);
      }
    }
  }

  async function runDeactivate(reassignToTechnicianId?: string) {
    setLoading(true);

    try {
      const result = await deactivateUserAction({
        userId: user.id,
        reassignToTechnicianId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Kullanıcı pasifleştirildi");
      resetDialog();
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function runDelete(reassignToTechnicianId?: string) {
    setLoading(true);

    try {
      const result = await deleteUserAction({
        userId: user.id,
        reassignToTechnicianId,
      });

      if (!result.success) {
        toast.error(result.error);
        setDialogStep("delete_confirm");
        return;
      }

      toast.success("Kullanıcı kalıcı olarak silindi");
      resetDialog();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
      toast.error(message);
      setDialogStep("delete_confirm");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    setLoading(true);

    try {
      const result = await activateUserAction(user.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Kullanıcı tekrar aktif edildi");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleReassignAndContinue() {
    if (!selectedTechnicianId) {
      toast.error("Lütfen bir teknisyen seçin");
      return;
    }

    if (pendingAction === "deactivate") {
      await runDeactivate(selectedTechnicianId);
      return;
    }

    setDialogStep("delete_confirm");
  }

  async function handleContinueWithoutReassign() {
    setSelectedTechnicianId("");

    if (pendingAction === "deactivate") {
      await runDeactivate();
      return;
    }

    setDialogStep("delete_confirm");
  }

  async function handleConfirmDelete() {
    await runDelete(selectedTechnicianId || undefined);
  }

  const tasksSummary =
    openTasks &&
    `Bu kullanıcının ${openTasks.openServiceRequests} açık servis talebi ve ${openTasks.openMaintenancePlans} bakım planı var. Başka bir teknisyene yönlendirilsin mi?`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-9 w-9"
              aria-label={`${user.full_name} işlemleri`}
              disabled={disabled || loading}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            Düzenle
          </DropdownMenuItem>
          {user.is_active ? (
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => {
                void beginAction("deactivate");
              }}
              disabled={disabled}
            >
              <Power className="size-4" />
              Pasifleştir
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleActivate} disabled={disabled}>
              <UserCheck className="size-4" />
              Aktif Et
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            closeOnClick={false}
            onClick={() => {
              void beginAction("delete");
            }}
            disabled={disabled}
          >
            <Trash2 className="size-4" />
            Kalıcı Olarak Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) resetDialog();
        }}
      >
        <DialogContent showCloseButton={!loading}>
          {dialogStep === "checking" ? (
            <>
              <DialogHeader>
                <DialogTitle>Görevler kontrol ediliyor</DialogTitle>
                <DialogDescription>
                  {user.full_name} için açık servis talepleri ve bakım planları
                  kontrol ediliyor…
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Lütfen bekleyin
              </div>
            </>
          ) : null}

          {dialogStep === "reassign" && openTasks ? (
            <>
              <DialogHeader>
                <DialogTitle>Açık görevler var</DialogTitle>
                <DialogDescription>{tasksSummary}</DialogDescription>
              </DialogHeader>

              <Field>
                <FieldLabel htmlFor={`technician-${user.id}`}>
                  Teknisyen Seç
                </FieldLabel>
                <select
                  id={`technician-${user.id}`}
                  className={selectClassName}
                  value={selectedTechnicianId}
                  onChange={(event) =>
                    setSelectedTechnicianId(event.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Teknisyen seçin</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name}
                      {staff.branch_name ? ` (${staff.branch_name})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetDialog()}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleContinueWithoutReassign}
                  disabled={loading}
                >
                  Yönlendirmeden Devam Et
                </Button>
                <Button
                  type="button"
                  onClick={handleReassignAndContinue}
                  disabled={loading || staffOptions.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      İşleniyor…
                    </>
                  ) : (
                    "Yönlendir ve Devam Et"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : null}

          {dialogStep === "delete_confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>Kalıcı silme onayı</DialogTitle>
                <DialogDescription>
                  Bu işlem geri alınamaz. <strong>{user.full_name}</strong>{" "}
                  sistemden kalıcı olarak silinecek.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetDialog()}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Siliniyor…
                    </>
                  ) : (
                    "Evet, Kalıcı Olarak Sil"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
