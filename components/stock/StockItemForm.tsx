"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
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
import { stockDetailHref, generateStockPartCode } from "@/components/stock/stock-utils";
import { checkPartCodeAvailable } from "@/lib/api/stock/check-part-code-available";
import { createStockItem } from "@/lib/api/stock/create-stock-item";
import { stockDetailToFormValues } from "@/lib/api/stock/stock-detail-to-form-values";
import { updateStockItem } from "@/lib/api/stock/update-stock-item";
import type {
  StockFormBranchOption,
  StockFormBrandOption,
  StockFormCategoryOption,
  StockItemDetail,
} from "@/lib/api/stock/types";
import { STOCK_FORM_UNIT_OPTIONS } from "@/lib/constants/stock-item";
import { cn } from "@/lib/utils";
import {
  stockItemFormSchema,
  type StockItemFormValues,
} from "@/schemas/stock-item";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[100px] resize-y py-2.5",
);

type StockItemFormCreateProps = {
  mode: "create";
  initialData?: null;
  categories: StockFormCategoryOption[];
  brands: StockFormBrandOption[];
  branches: StockFormBranchOption[];
  defaultBranchId?: string | null;
  showBranchSelect: boolean;
};

type StockItemFormEditProps = {
  mode: "edit";
  initialData: StockItemDetail;
  categories: StockFormCategoryOption[];
  brands: StockFormBrandOption[];
  branches: StockFormBranchOption[];
  defaultBranchId?: string | null;
  showBranchSelect: boolean;
};

type StockItemFormProps = StockItemFormCreateProps | StockItemFormEditProps;

function emptyFormValues(defaultBranchId?: string | null): StockItemFormValues {
  return {
    part_code: generateStockPartCode(),
    description: "",
    category: "other",
    brand_id: "",
    unit: "piece",
    min_stock: 5,
    branch_id: defaultBranchId ?? "",
    initial_quantity: 0,
    notes: "",
  };
}

export function StockItemForm(props: StockItemFormProps) {
  const {
    mode,
    categories,
    brands,
    branches,
    defaultBranchId = null,
    showBranchSelect,
  } = props;
  const router = useRouter();
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const editItem = isEdit ? props.initialData : null;
  const excludePartId = editItem?.part_id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeCheck, setCodeCheck] = useState<{
    status: "idle" | "checking" | "available" | "taken";
    message?: string;
  }>({ status: "idle" });

  const defaultCategory = categories[0]?.code ?? "other";

  const resolvedDefaults = useMemo((): StockItemFormValues => {
    if (isEdit && editItem) {
      return stockDetailToFormValues(editItem);
    }
    const base = emptyFormValues(defaultBranchId);
    return {
      ...base,
      category: defaultCategory,
      branch_id: defaultBranchId ?? branches[0]?.id ?? "",
    };
  }, [isEdit, editItem, defaultBranchId, defaultCategory, branches]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemFormSchema),
    defaultValues: resolvedDefaults,
  });

  const watchedPartCode = useWatch({ control, name: "part_code" });

  const codeUnavailable =
    codeCheck.status === "taken" || codeCheck.status === "checking";

  useEffect(() => {
    const code = watchedPartCode?.trim() ?? "";
    if (!code) {
      setCodeCheck({ status: "idle" });
      return;
    }

    const timer = window.setTimeout(async () => {
      setCodeCheck({ status: "checking" });
      const result = await checkPartCodeAvailable(code, excludePartId);
      setCodeCheck(
        result.available
          ? { status: "available" }
          : { status: "taken", message: result.message },
      );
    }, 400);

    return () => window.clearTimeout(timer);
  }, [watchedPartCode, excludePartId]);

  async function verifyPartCode(code: string) {
    const normalized = code.trim();
    if (!normalized) {
      setCodeCheck({ status: "idle" });
      return true;
    }

    setCodeCheck({ status: "checking" });
    const result = await checkPartCodeAvailable(normalized, excludePartId);
    if (!result.available) {
      setCodeCheck({ status: "taken", message: result.message });
      return false;
    }
    setCodeCheck({ status: "available" });
    return true;
  }

  function handleGenerateCode() {
    const next = generateStockPartCode();
    setValue("part_code", next, { shouldDirty: true, shouldValidate: true });
    setCodeCheck({ status: "idle" });
  }

  async function onSubmit(values: StockItemFormValues) {
    const codeOk = await verifyPartCode(values.part_code);
    if (!codeOk) {
      toast.error(codeCheck.message ?? "Bu ürün kodu zaten kullanılıyor");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      part_code: values.part_code.trim().toUpperCase(),
      description: values.description.trim(),
      category: values.category,
      brand_id: values.brand_id?.trim() ? values.brand_id : null,
      unit: values.unit,
      min_stock: values.min_stock,
      branch_id: values.branch_id,
      notes: values.notes?.trim() ? values.notes.trim() : null,
      supplier_name: null as string | null,
      supplier_code: null as string | null,
    };

    if (isEdit && editItem) {
      const result = await updateStockItem({
        part_id: editItem.part_id,
        ...payload,
        supplier_name: editItem.supplier_name,
        supplier_code: editItem.supplier_code,
        list_price: editItem.list_price,
        minimum_price: editItem.minimum_price,
        unit_cost: editItem.unit_cost,
        max_stock: editItem.branch.max_stock,
      });

      setIsSubmitting(false);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Stok ürünü güncellendi");
      router.push(
        stockDetailHref(result.data.partId, result.data.branchId),
      );
      router.refresh();
      return;
    }

    if (!isCreate) {
      setIsSubmitting(false);
      return;
    }

    const result = await createStockItem({
      ...payload,
      initial_quantity:
        values.initial_quantity > 0 ? values.initial_quantity : null,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Stok ürünü oluşturuldu");
    router.push(
      stockDetailHref(result.data.partId, result.data.branchId),
    );
    router.refresh();
  }

  function handleCancel() {
    if (
      isDirty &&
      !window.confirm(
        "Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?",
      )
    ) {
      return;
    }
    if (isEdit && editItem) {
      router.push(
        stockDetailHref(editItem.part_id, editItem.branch.branch_id),
      );
      return;
    }
    router.push("/stock");
  }

  const cancelHref =
    isEdit && editItem
      ? stockDetailHref(editItem.part_id, editItem.branch.branch_id)
      : "/stock";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
          <CardDescription>
            Parça kodu, ad ve kategori bilgilerini girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="part_code">Ürün Kodu *</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="part_code"
                  className="h-10 font-mono uppercase"
                  placeholder="PR-XXXXX"
                  disabled={isSubmitting}
                  {...register("part_code", {
                    onChange: () => setCodeCheck({ status: "idle" }),
                  })}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-2"
                  disabled={isSubmitting || isEdit}
                  onClick={handleGenerateCode}
                >
                  <RefreshCw className="size-4" />
                  Kod üret
                </Button>
              </div>
              {errors.part_code ? (
                <FieldError>{errors.part_code.message}</FieldError>
              ) : null}
              {codeCheck.status === "checking" ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Ürün kodu kontrol ediliyor…
                </p>
              ) : null}
              {codeCheck.status === "taken" ? (
                <FieldError>{codeCheck.message}</FieldError>
              ) : null}
              {codeCheck.status === "available" ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Ürün kodu kullanılabilir
                </p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Ürün Adı *</FieldLabel>
              <Input
                id="description"
                className="h-10"
                placeholder="Örn. Kesici bıçak seti"
                disabled={isSubmitting}
                {...register("description")}
              />
              {errors.description ? (
                <FieldError>{errors.description.message}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="category">Kategori *</FieldLabel>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <select
                      id="category"
                      className={selectClassName}
                      disabled={isSubmitting}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {categories.map((category) => (
                        <option key={category.code} value={category.code}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.category ? (
                  <FieldError>{errors.category.message}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="brand_id">Marka</FieldLabel>
                <Controller
                  control={control}
                  name="brand_id"
                  render={({ field }) => (
                    <select
                      id="brand_id"
                      className={selectClassName}
                      disabled={isSubmitting}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    >
                      <option value="">Marka seçilmedi</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.brand_id ? (
                  <FieldError>{errors.brand_id.message}</FieldError>
                ) : null}
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stok Ayarları</CardTitle>
          <CardDescription>
            Şube, birim ve kritik seviye bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="unit">Birim *</FieldLabel>
                <Controller
                  control={control}
                  name="unit"
                  render={({ field }) => (
                    <select
                      id="unit"
                      className={selectClassName}
                      disabled={isSubmitting}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {STOCK_FORM_UNIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.unit ? (
                  <FieldError>{errors.unit.message}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="min_stock">Kritik Stok Seviyesi *</FieldLabel>
                <Input
                  id="min_stock"
                  type="number"
                  min={0}
                  step="any"
                  className="h-10 tabular-nums"
                  disabled={isSubmitting}
                  {...register("min_stock", { valueAsNumber: true })}
                />
                {errors.min_stock ? (
                  <FieldError>{errors.min_stock.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="branch_id">Şube *</FieldLabel>
                {showBranchSelect && isCreate ? (
                  <Controller
                    control={control}
                    name="branch_id"
                    render={({ field }) => (
                      <select
                        id="branch_id"
                        className={selectClassName}
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="">Şube seçin</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </option>
                        ))}
                      </select>
                    )}
                  />
                ) : (
                  <>
                    <input
                      type="hidden"
                      {...register("branch_id")}
                    />
                    <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm">
                      {branches.find((b) => b.id === defaultBranchId)?.name ??
                        branches[0]?.name ??
                        "—"}
                    </div>
                  </>
                )}
                {errors.branch_id ? (
                  <FieldError>{errors.branch_id.message}</FieldError>
                ) : null}
              </Field>

              {isCreate ? (
                <Field>
                  <FieldLabel htmlFor="initial_quantity">
                    Başlangıç Stoku
                  </FieldLabel>
                  <Input
                    id="initial_quantity"
                    type="number"
                    min={0}
                    step="any"
                    className="h-10 tabular-nums"
                    disabled={isSubmitting}
                    {...register("initial_quantity", { valueAsNumber: true })}
                  />
                  {errors.initial_quantity ? (
                    <FieldError>{errors.initial_quantity.message}</FieldError>
                  ) : null}
                </Field>
              ) : null}
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Açıklama</FieldLabel>
              <textarea
                id="notes"
                className={textareaClassName}
                placeholder="Ek notlar (opsiyonel)"
                disabled={isSubmitting}
                {...register("notes")}
              />
              {errors.notes ? (
                <FieldError>{errors.notes.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-11 w-full sm:w-auto"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          İptal
        </Button>
        <SubmitButton
          isLoading={isSubmitting}
          loadingText="Kaydediliyor…"
          className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
          disabled={codeUnavailable}
        >
          {isEdit ? "Güncelle" : "Ürün Ekle"}
        </SubmitButton>
      </div>

      <p className="text-center text-xs text-muted-foreground sm:text-left">
        <Link
          href={cancelHref}
          className="underline-offset-4 hover:underline"
          onClick={(e) => {
            if (
              isDirty &&
              !window.confirm(
                "Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          {isEdit ? "Detaya dön" : "Listeye dön"}
        </Link>
      </p>
    </form>
  );
}
