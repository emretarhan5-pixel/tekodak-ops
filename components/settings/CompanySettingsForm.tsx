"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SaveCompanyProfileAction } from "@/lib/api/settings/types";
import {
  companyProfileSchema,
  type CompanyProfileInput,
} from "@/schemas/settings";

type CompanySettingsFormProps = {
  initial: CompanyProfileInput;
  saveCompanySettingsAction: SaveCompanyProfileAction;
};

export function CompanySettingsForm({
  initial,
  saveCompanySettingsAction,
}: CompanySettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<CompanyProfileInput>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: CompanyProfileInput) {
    setSaving(true);
    try {
      const result = await saveCompanySettingsAction(values);
      if (!result.success) {
        toast.error(result.error ?? "Kayıt başarısız");
        return;
      }
      toast.success("Şirket bilgileri kaydedildi");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Şirket Bilgileri</CardTitle>
        <p className="text-sm text-muted-foreground">
          TEKODAK Şirketler Grubu iletişim ve fatura bilgileri
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="company-name">Şirket adı *</FieldLabel>
            <Input id="company-name" {...form.register("name")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="company-address">Adres</FieldLabel>
            <Input id="company-address" {...form.register("address")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="company-phone">Telefon</FieldLabel>
              <Input id="company-phone" {...form.register("phone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-email">E-posta</FieldLabel>
              <Input
                id="company-email"
                type="email"
                {...form.register("email")}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="company-tax">Vergi no</FieldLabel>
            <Input id="company-tax" {...form.register("tax_number")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="company-logo">Logo URL (opsiyonel)</FieldLabel>
            <Input
              id="company-logo"
              type="url"
              placeholder="https://..."
              {...form.register("logo_url")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Dosya yükleme PROMPT 16 ile eklenecek; şimdilik logo adresi
              girin.
            </p>
          </Field>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? (
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
