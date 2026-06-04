"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { CONTRACT_TYPES } from "@/lib/constants/contract";
import { PART_CATEGORIES } from "@/lib/constants/stock-item";
import type {
  CategoryListItem,
  DeactivateCategoryAction,
  SaveCategoryAction,
} from "@/lib/api/settings/types";
import {
  categoryFormSchema,
  type CategoryFormInput,
} from "@/schemas/settings";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type CategoriesSettingsProps = {
  title: string;
  description: string;
  categoryType: "contract_type" | "part_category";
  categories: CategoryListItem[];
  saveCategoryAction: SaveCategoryAction;
  deactivateCategoryAction: DeactivateCategoryAction;
};

export function CategoriesSettings({
  title,
  description,
  categoryType,
  categories,
  saveCategoryAction,
  deactivateCategoryAction,
}: CategoriesSettingsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] =
    useState<CategoryListItem | null>(null);
  const [saving, setSaving] = useState(false);

  const allowedCodes = useMemo(() => {
    const pool =
      categoryType === "contract_type"
        ? [...CONTRACT_TYPES]
        : [...PART_CATEGORIES];
    const used = new Set(categories.map((c) => c.code));
    return pool.filter((code) => !used.has(code));
  }, [categoryType, categories]);

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      category_type: categoryType,
      code: allowedCodes[0] ?? "",
      display_name: "",
      description: "",
      display_order: 0,
      is_active: true,
    },
  });

  const editingId = form.watch("id");
  const isSystemEdit = categories.find((c) => c.id === editingId)?.is_system;

  function openCreate() {
    form.reset({
      category_type: categoryType,
      code: allowedCodes[0] ?? "",
      display_name: "",
      description: "",
      display_order: categories.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  }

  function openEdit(item: CategoryListItem) {
    form.reset({
      id: item.id,
      category_type: item.category_type,
      code: item.code,
      display_name: item.display_name,
      description: item.description ?? "",
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: CategoryFormInput) {
    setSaving(true);
    try {
      const result = await saveCategoryAction(values);
      if (!result.success) {
        toast.error(result.error ?? "Kayıt başarısız");
        return;
      }
      toast.success(values.id ? "Kayıt güncellendi" : "Kayıt eklendi");
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>

      <div className="flex justify-end">
        <Button
          type="button"
          className="gap-2"
          onClick={openCreate}
          disabled={allowedCodes.length === 0 && !editingId}
        >
          <Plus className="size-4" />
          Ekle
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Görünen Ad</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              categories.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.display_name}
                    {item.is_system ? (
                      <Badge variant="outline" className="ml-2">
                        Sistem
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{item.code}</code>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.display_order}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "secondary" : "outline"}>
                      {item.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                        Düzenle
                      </Button>
                      {item.is_active ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive"
                          onClick={() => setDeactivateTarget(item)}
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
                {editingId ? `${title} düzenle` : `Yeni ${title.toLowerCase()}`}
              </DialogTitle>
              <DialogDescription>
                Kod değeri veritabanı kısıtlarıyla uyumlu olmalıdır
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel htmlFor="cat-code">Kod *</FieldLabel>
                {editingId && isSystemEdit ? (
                  <Input id="cat-code" readOnly {...form.register("code")} />
                ) : editingId ? (
                  <Input id="cat-code" readOnly {...form.register("code")} />
                ) : (
                  <select
                    id="cat-code"
                    className={selectClassName}
                    {...form.register("code")}
                  >
                    {allowedCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="cat-name">Görünen ad *</FieldLabel>
                <Input id="cat-name" {...form.register("display_name")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="cat-desc">Açıklama</FieldLabel>
                <Input id="cat-desc" {...form.register("description")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="cat-order">Sıra</FieldLabel>
                <Input
                  id="cat-order"
                  type="number"
                  min={0}
                  {...form.register("display_order")}
                />
              </Field>
              <Field className="flex flex-row items-center gap-3">
                <input
                  id="cat-active"
                  type="checkbox"
                  className="size-4 rounded border border-border"
                  {...form.register("is_active")}
                />
                <FieldLabel htmlFor="cat-active" className="font-normal">
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
        title="Kaydı pasifleştir"
        description={`${deactivateTarget?.display_name ?? ""} pasif yapılacak.`}
        onConfirm={async () => {
          if (!deactivateTarget) return { success: false };
          const result = await deactivateCategoryAction(deactivateTarget.id);
          if (!result.success) {
            toast.error(result.error ?? "İşlem başarısız");
            return result;
          }
          toast.success("Kayıt pasifleştirildi");
          router.refresh();
          return result;
        }}
      />
    </div>
  );
}
