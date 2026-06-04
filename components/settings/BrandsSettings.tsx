"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { SettingsDeactivateDialog } from "@/components/settings/settings-deactivate-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BrandListItem,
  DeactivateBrandAction,
  SaveBrandAction,
} from "@/lib/api/settings/types";
import { brandFormSchema, type BrandFormInput } from "@/schemas/settings";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type BrandsSettingsProps = {
  brands: BrandListItem[];
  saveBrandAction: SaveBrandAction;
  deactivateBrandAction: DeactivateBrandAction;
};

const emptyForm: BrandFormInput = {
  name: "",
  default_warranty_years: 2,
  display_order: 0,
  description: "",
  is_active: true,
};

export function BrandsSettings({
  brands,
  saveBrandAction,
  deactivateBrandAction,
}: BrandsSettingsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<BrandListItem | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const form = useForm<BrandFormInput>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: emptyForm,
  });

  function openCreate() {
    form.reset(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(brand: BrandListItem) {
    form.reset({
      id: brand.id,
      name: brand.name,
      default_warranty_years: brand.default_warranty_years,
      display_order: brand.display_order,
      description: brand.description ?? "",
      is_active: brand.is_active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: BrandFormInput) {
    setSaving(true);
    try {
      const result = await saveBrandAction(values);
      if (!result.success) {
        toast.error(result.error ?? "Kayıt başarısız");
        return;
      }
      toast.success(values.id ? "Marka güncellendi" : "Marka eklendi");
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Marka Ekle
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marka Adı</TableHead>
              <TableHead>Varsayılan Garanti</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Henüz marka kaydı yok
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.default_warranty_years} yıl</TableCell>
                  <TableCell className="tabular-nums">
                    {brand.display_order}
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.is_active ? "secondary" : "outline"}>
                      {brand.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openEdit(brand)}
                      >
                        <Pencil className="size-3.5" />
                        Düzenle
                      </Button>
                      {brand.is_active ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive"
                          onClick={() => setDeactivateTarget(brand)}
                        >
                          <Trash2 className="size-3.5" />
                          Pasifleştir
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {form.watch("id") ? "Markayı düzenle" : "Yeni marka"}
              </DialogTitle>
              <DialogDescription>
                Cihaz markaları ve varsayılan garanti süreleri
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel htmlFor="brand-name">Marka adı *</FieldLabel>
                <Input id="brand-name" {...form.register("name")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="brand-warranty">
                    Varsayılan garanti (yıl) *
                  </FieldLabel>
                  <Input
                    id="brand-warranty"
                    type="number"
                    min={0}
                    {...form.register("default_warranty_years")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="brand-order">Sıra</FieldLabel>
                  <Input
                    id="brand-order"
                    type="number"
                    min={0}
                    {...form.register("display_order")}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="brand-desc">Açıklama</FieldLabel>
                <Input id="brand-desc" {...form.register("description")} />
              </Field>
              <Field className="flex flex-row items-center gap-3">
                <input
                  id="brand-active"
                  type="checkbox"
                  className="size-4 rounded border border-border"
                  {...form.register("is_active")}
                />
                <FieldLabel htmlFor="brand-active" className="font-normal">
                  Aktif
                </FieldLabel>
              </Field>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
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

      <SettingsDeactivateDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Markayı pasifleştir"
        description={`${deactivateTarget?.name ?? ""} markası pasif yapılacak. Mevcut cihaz kayıtları etkilenmez.`}
        onConfirm={async () => {
          if (!deactivateTarget) return { success: false };
          const result = await deactivateBrandAction(deactivateTarget.id);
          if (!result.success) {
            toast.error(result.error ?? "İşlem başarısız");
            return result;
          }
          toast.success("Marka pasifleştirildi");
          router.refresh();
          return result;
        }}
      />
    </div>
  );
}
