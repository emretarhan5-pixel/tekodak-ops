"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthBrand } from "@/components/auth/auth-brand";
import { SubmitButton } from "@/components/auth/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { APP_USER_SELECT, type AppUser } from "@/lib/types/user";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const redirectTo = searchParams?.get("redirectTo") ?? "/dashboard";
  const urlError = searchParams?.get("error");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const urlErrorMessage =
    urlError === "inactive"
      ? AUTH_MESSAGES.profileInactive
      : urlError === "forbidden"
        ? "Bu sayfaya erişim yetkiniz yok."
        : null;

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    const supabase = createClient();

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

    if (signInError) {
      setFormError(mapAuthError(signInError.message));
      return;
    }

    if (!authData.user) {
      setFormError("Giriş yapılamadı. Lütfen tekrar deneyin.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(APP_USER_SELECT)
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setFormError(AUTH_MESSAGES.profileNotFound);
      return;
    }

    const appUser = profile as AppUser;

    if (!appUser.is_active || appUser.deleted_at) {
      await supabase.auth.signOut();
      setFormError(AUTH_MESSAGES.profileInactive);
      return;
    }

    router.push(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="border-b border-border/60 pb-6">
        <AuthBrand subtitle="Saha servis yönetim platformu" />
        <CardTitle className="text-center text-lg">Giriş Yap</CardTitle>
        <CardDescription className="text-center">
          Kurumsal hesabınızla devam edin
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {(formError || urlErrorMessage) && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError ?? urlErrorMessage}
          </div>
        )}

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

            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="password">Şifre</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!form.formState.errors.password}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>

            <div className="flex items-center justify-between gap-4">
              <Field orientation="horizontal" className="w-auto items-center">
                <Checkbox
                  id="rememberMe"
                  checked={form.watch("rememberMe")}
                  onCheckedChange={(checked) =>
                    form.setValue("rememberMe", checked === true)
                  }
                />
                <FieldLabel htmlFor="rememberMe" className="font-normal">
                  Beni hatırla
                </FieldLabel>
              </Field>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>
          </FieldGroup>

          <SubmitButton
            isLoading={form.formState.isSubmitting}
            loadingText="Giriş yapılıyor…"
          >
            Giriş Yap
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
