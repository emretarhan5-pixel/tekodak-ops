"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  SendPasswordResetAction,
  SetUserPasswordAction,
  UserListItem,
} from "@/lib/api/users/types";
import {
  setUserPasswordSchema,
  type SetUserPasswordInput,
} from "@/schemas/user";

type ResetUserPasswordDialogProps = {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sendPasswordResetAction: SendPasswordResetAction;
  setUserPasswordAction: SetUserPasswordAction;
};

export function ResetUserPasswordDialog({
  user,
  open,
  onOpenChange,
  sendPasswordResetAction,
  setUserPasswordAction,
}: ResetUserPasswordDialogProps) {
  const [sendingEmail, setSendingEmail] = useState(false);

  const form = useForm<SetUserPasswordInput>({
    resolver: zodResolver(setUserPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) {
      form.reset({ password: "", confirmPassword: "" });
      setSendingEmail(false);
    }
  }, [open, form]);

  async function handleSendResetEmail() {
    if (!user) return;

    setSendingEmail(true);

    try {
      const result = await sendPasswordResetAction(user.id, user.email);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Sıfırlama maili gönderildi");
      onOpenChange(false);
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setSendingEmail(false);
    }
  }

  async function onSubmit(values: SetUserPasswordInput) {
    if (!user) return;

    try {
      const result = await setUserPasswordAction(
        user.id,
        values.password,
        values.confirmPassword,
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Şifre güncellendi");
      onOpenChange(false);
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    }
  }

  function onInvalid() {
    const firstError = Object.values(form.formState.errors)[0];
    toast.error(firstError?.message ?? "Lütfen şifre alanlarını kontrol edin");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Şifre Sıfırla — {user?.full_name ?? ""}
          </DialogTitle>
          <DialogDescription>
            {user?.email} için sıfırlama maili gönderin veya yeni şifre belirleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Sıfırlama maili gönder</p>
            <p className="text-sm text-muted-foreground">
              Kullanıcıya e-posta gider; kendi şifresini belirler.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={sendingEmail || isSubmitting || !user}
              onClick={() => void handleSendResetEmail()}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Gönderiliyor…
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  Sıfırlama Maili Gönder
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Manuel şifre belirle</p>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="reset-password">Yeni şifre *</FieldLabel>
                  <Input
                    id="reset-password"
                    type="password"
                    className="h-10"
                    autoComplete="new-password"
                    disabled={sendingEmail || isSubmitting}
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="reset-password-confirm">
                    Tekrar *
                  </FieldLabel>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    className="h-10"
                    autoComplete="new-password"
                    disabled={sendingEmail || isSubmitting}
                    {...form.register("confirmPassword")}
                  />
                  <FieldError
                    errors={[form.formState.errors.confirmPassword]}
                  />
                </Field>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={sendingEmail || isSubmitting || !user}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Kaydediliyor…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
