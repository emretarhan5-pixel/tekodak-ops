"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthBrand } from "@/components/auth/auth-brand";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AUTH_MESSAGES, mapAuthError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionReady, setSessionReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function prepareRecoverySession() {
      const supabase = createClient();
      const code = searchParams?.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setInitError(AUTH_MESSAGES.invalidResetLink);
          return;
        }
        setSessionReady(true);
        return;
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setInitError(AUTH_MESSAGES.invalidResetLink);
        return;
      }

      setSessionReady(true);
    }

    void prepareRecoverySession();
  }, [searchParams]);

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setFormError(mapAuthError(error.message));
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2000);
  }

  if (initError) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="border-b border-border/60 pb-6">
          <AuthBrand subtitle="Şifre sıfırlama" />
          <CardTitle className="text-center text-lg">Bağlantı Geçersiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-center text-sm text-muted-foreground">{initError}</p>
          <Link
            href="/forgot-password"
            className="block text-center text-sm text-primary hover:underline"
          >
            Yeni sıfırlama isteği oluştur
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!sessionReady) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Bağlantı doğrulanıyor…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="border-b border-border/60 pb-6">
        <AuthBrand subtitle="Yeni şifre belirleme" />
        <CardTitle className="text-center text-lg">Yeni Şifre</CardTitle>
        <CardDescription className="text-center">
          Güçlü bir şifre seçin (min. 8 karakter)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-center text-sm text-foreground">
            {AUTH_MESSAGES.passwordUpdated}
          </div>
        ) : null}

        {formError ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        ) : null}

        {!success ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.password}>
                <FieldLabel htmlFor="password">Yeni şifre</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register("password")}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.confirmPassword}>
                <FieldLabel htmlFor="confirmPassword">Şifre tekrar</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!form.formState.errors.confirmPassword}
                  {...form.register("confirmPassword")}
                />
                <FieldError errors={[form.formState.errors.confirmPassword]} />
              </Field>
            </FieldGroup>

            <SubmitButton
              isLoading={form.formState.isSubmitting}
              loadingText="Kaydediliyor…"
            >
              Şifreyi Güncelle
            </SubmitButton>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
