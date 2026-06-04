"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  BranchOption,
  UpdateUserAction,
  UserListItem,
} from "@/lib/api/users/types";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { USER_ROLES } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import { updateUserSchema, type UpdateUserInput } from "@/schemas/user";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type EditUserDialogProps = {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  updateUserAction: UpdateUserAction;
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  branches,
  updateUserAction,
}: EditUserDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: "",
      full_name: "",
      role: USER_ROLES.STAFF,
      branch_id: "",
    },
  });

  const role = form.watch("role");

  useEffect(() => {
    if (!user || !open) return;

    form.reset({
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id ?? "",
    });
  }, [user, open, form]);

  async function onSubmit(values: UpdateUserInput) {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const result = await updateUserAction({
        ...values,
        branch_id: values.role === USER_ROLES.STAFF ? values.branch_id : null,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Kullanıcı güncellendi");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı düzenle</DialogTitle>
            <DialogDescription>
              {user?.email} — rol ve şube atamasını güncelleyin
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="edit-full_name">Ad soyad *</FieldLabel>
              <Input
                id="edit-full_name"
                className="h-10"
                {...form.register("full_name")}
              />
              <FieldError errors={[form.formState.errors.full_name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-role">Rol *</FieldLabel>
              <select
                id="edit-role"
                className={selectClassName}
                {...form.register("role")}
              >
                <option value={USER_ROLES.STAFF}>{ROLE_LABELS.staff}</option>
                <option value={USER_ROLES.ADMIN}>{ROLE_LABELS.admin}</option>
              </select>
              <FieldError errors={[form.formState.errors.role]} />
            </Field>

            {role === USER_ROLES.STAFF ? (
              <Field>
                <FieldLabel htmlFor="edit-branch_id">Şube *</FieldLabel>
                <select
                  id="edit-branch_id"
                  className={selectClassName}
                  {...form.register("branch_id")}
                >
                  <option value="">Şube seçin</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
                <FieldError errors={[form.formState.errors.branch_id]} />
              </Field>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Kaydediliyor…
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
