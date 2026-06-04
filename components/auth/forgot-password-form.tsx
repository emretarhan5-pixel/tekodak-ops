"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schemas/auth";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    setSuccess(false);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      values.email.trim(),
      { redirectTo },
    );

    if (error) {
      setFormError(mapAuthError(error.message));
      return;
    }

    setSuccess(true);
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="border-b border-border/60 pb-6">
        <AuthBrand subtitle="Şifre sıfırlama" />
        <CardTitle className="text-center text-lg">Şifremi Unuttum</CardTitle>
        <CardDescription className="text-center">
          E-posta adresinize sıfırlama bağlantısı göndereceğiz
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-foreground">
            {AUTH_MESSAGES.resetEmailSent}
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
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="email">E-posta</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@tekodak.com.tr"
                  aria-invalid={!!form.formState.errors.email}
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
            </FieldGroup>

            <SubmitButton
              isLoading={form.formState.isSubmitting}
              loadingText="Gönderiliyor…"
            >
              Sıfırlama Bağlantısı Gönder
            </SubmitButton>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Giriş sayfasına dön
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
