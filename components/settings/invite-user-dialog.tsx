"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import type { BranchOption, InviteUserAction } from "@/lib/api/users/types";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { USER_ROLES } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import { inviteUserSchema, type InviteUserInput } from "@/schemas/user";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  inviteUserAction: InviteUserAction;
};

type CredentialsState = {
  email: string;
  temporaryPassword: string;
  recoveryLink: string | null;
};

export function InviteUserDialog({
  open,
  onOpenChange,
  branches,
  inviteUserAction,
}: InviteUserDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsState | null>(null);

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: USER_ROLES.STAFF,
      branch_id: "",
      temporary_password: "",
    },
  });

  const role = form.watch("role");

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setCredentials(null);
    }
    onOpenChange(nextOpen);
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} kopyalandı`);
    } catch {
      toast.error("Kopyalanamadı");
    }
  }

  function onInvalid() {
    toast.error("Lütfen zorunlu alanları doldurun");
  }

  async function onSubmit(values: InviteUserInput) {
    setIsSubmitting(true);

    try {
      const result = await inviteUserAction({
        ...values,
        branch_id: values.role === USER_ROLES.STAFF ? values.branch_id : null,
        temporary_password: values.temporary_password || "",
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Davet gönderildi");
      setCredentials({
        email: result.data.email,
        temporaryPassword: result.data.temporaryPassword,
        recoveryLink: result.data.recoveryLink,
      });
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Kullanıcı oluşturuldu</DialogTitle>
              <DialogDescription>
                E-posta gönderimi henüz aktif değil. Geçici şifreyi veya şifre
                sıfırlama bağlantısını personelle paylaşın.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div>
                <p className="text-muted-foreground">E-posta</p>
                <p className="font-medium">{credentials.email}</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-muted-foreground">Geçici şifre</p>
                  <p className="font-mono font-medium">
                    {credentials.temporaryPassword}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyText("Şifre", credentials.temporaryPassword)
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              {credentials.recoveryLink ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Şifre belirleme bağlantısı
                  </p>
                  <p className="break-all font-mono text-xs">
                    {credentials.recoveryLink}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      copyText("Bağlantı", credentials.recoveryLink!)
                    }
                  >
                    <Copy className="size-4" />
                    Bağlantıyı kopyala
                  </Button>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleClose(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
            <DialogHeader>
              <DialogTitle>Yeni kullanıcı davet et</DialogTitle>
              <DialogDescription>
                Hesap oluşturulur ve geçici şifre üretilir. E-posta daveti
                sonraki fazda eklenecek.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="invite-full_name">Ad soyad *</FieldLabel>
                <Input
                  id="invite-full_name"
                  className="h-10"
                  {...form.register("full_name")}
                />
                <FieldError errors={[form.formState.errors.full_name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="invite-email">E-posta *</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  className="h-10"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="invite-role">Rol *</FieldLabel>
                <select
                  id="invite-role"
                  className={selectClassName}
                  {...form.register("role")}
                >
                  <option value={USER_ROLES.STAFF}>
                    {ROLE_LABELS.staff}
                  </option>
                  <option value={USER_ROLES.ADMIN}>
                    {ROLE_LABELS.admin}
                  </option>
                </select>
                <FieldError errors={[form.formState.errors.role]} />
              </Field>

              {role === USER_ROLES.STAFF ? (
                <Field>
                  <FieldLabel htmlFor="invite-branch_id">Şube *</FieldLabel>
                  <select
                    id="invite-branch_id"
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

              <Field>
                <FieldLabel htmlFor="invite-password">
                  Geçici şifre (opsiyonel)
                </FieldLabel>
                <Input
                  id="invite-password"
                  type="text"
                  className="h-10"
                  placeholder="Boş bırakılırsa otomatik üretilir"
                  autoComplete="new-password"
                  {...form.register("temporary_password")}
                />
                <FieldError
                  errors={[form.formState.errors.temporary_password]}
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Oluşturuluyor…
                  </>
                ) : (
                  "Kullanıcı oluştur"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
