"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
  BrandOption,
  DeactivateDeviceModelAction,
  DeviceModelListItem,
  SaveDeviceModelAction,
} from "@/lib/api/settings/types";
import {
  deviceModelFormSchema,
  type DeviceModelFormInput,
} from "@/schemas/settings";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type DeviceModelsSettingsProps = {
  models: DeviceModelListItem[];
  brands: BrandOption[];
  brandId?: string;
  saveDeviceModelAction: SaveDeviceModelAction;
  deactivateDeviceModelAction: DeactivateDeviceModelAction;
};

export function DeviceModelsSettings({
  models,
  brands,
  brandId,
  saveDeviceModelAction,
  deactivateDeviceModelAction,
}: DeviceModelsSettingsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] =
    useState<DeviceModelListItem | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultBrandId = brandId ?? brands[0]?.id ?? "";

  const form = useForm<DeviceModelFormInput>({
    resolver: zodResolver(deviceModelFormSchema),
    defaultValues: {
      brand_id: defaultBrandId,
      model_name: "",
      display_order: 0,
      is_active: true,
    },
  });

  function pushBrandFilter(nextBrandId: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", "device-models");
    if (nextBrandId) {
      next.set("brandId", nextBrandId);
    } else {
      next.delete("brandId");
    }
    startTransition(() => {
      router.push(`${pathname ?? "/"}?${next.toString()}`);
    });
  }

  function openCreate() {
    form.reset({
      brand_id: brandId ?? defaultBrandId,
      model_name: "",
      display_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  }

  function openEdit(model: DeviceModelListItem) {
    form.reset({
      id: model.id,
      brand_id: model.brand_id,
      model_name: model.model_name,
      display_order: model.display_order,
      is_active: model.is_active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: DeviceModelFormInput) {
    setSaving(true);
    try {
      const result = await saveDeviceModelAction(values);
      if (!result.success) {
        toast.error(result.error ?? "Kayıt başarısız");
        return;
      }
      toast.success(values.id ? "Model güncellendi" : "Model eklendi");
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field className="max-w-xs">
          <FieldLabel htmlFor="filter-brand">Marka filtresi</FieldLabel>
          <select
            id="filter-brand"
            className={selectClassName}
            value={brandId ?? ""}
            disabled={isPending}
            onChange={(e) => pushBrandFilter(e.target.value)}
          >
            <option value="">Tüm markalar</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </Field>
        <Button type="button" className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Model Ekle
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.model_name}</TableCell>
                  <TableCell>{model.brand_name}</TableCell>
                  <TableCell className="tabular-nums">
                    {model.display_order}
                  </TableCell>
                  <TableCell>
                    <Badge variant={model.is_active ? "secondary" : "outline"}>
                      {model.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openEdit(model)}
                      >
                        <Pencil className="size-3.5" />
                        Düzenle
                      </Button>
                      {model.is_active ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive"
                          onClick={() => setDeactivateTarget(model)}
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
                {form.watch("id") ? "Modeli düzenle" : "Yeni cihaz modeli"}
              </DialogTitle>
              <DialogDescription>Markaya bağlı cihaz modeli</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel htmlFor="model-brand">Marka *</FieldLabel>
                <select
                  id="model-brand"
                  className={selectClassName}
                  {...form.register("brand_id")}
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="model-name">Model adı *</FieldLabel>
                <Input id="model-name" {...form.register("model_name")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="model-order">Sıra</FieldLabel>
                <Input
                  id="model-order"
                  type="number"
                  min={0}
                  {...form.register("display_order")}
                />
              </Field>
              <Field className="flex flex-row items-center gap-3">
                <input
                  id="model-active"
                  type="checkbox"
                  className="size-4 rounded border border-border"
                  {...form.register("is_active")}
                />
                <FieldLabel htmlFor="model-active" className="font-normal">
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
        title="Modeli pasifleştir"
        description={`${deactivateTarget?.model_name ?? ""} pasif yapılacak.`}
        onConfirm={async () => {
          if (!deactivateTarget) return { success: false };
          const result = await deactivateDeviceModelAction(deactivateTarget.id);
          if (!result.success) {
            toast.error(result.error ?? "İşlem başarısız");
            return result;
          }
          toast.success("Model pasifleştirildi");
          router.refresh();
          return result;
        }}
      />
    </div>
  );
}
