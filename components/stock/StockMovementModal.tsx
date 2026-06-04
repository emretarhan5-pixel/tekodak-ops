"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
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
import { formatStockQuantity } from "@/components/stock/stock-utils";
import { createStockMovement } from "@/lib/api/stock/create-stock-movement";
import { getStockMovementFormOptions } from "@/lib/api/stock/get-stock-movement-form-options";
import type { StockMovementFormOptions } from "@/lib/api/stock/types";
import {
  STOCK_MOVEMENT_KIND_LABELS,
  STOCK_MOVEMENT_KINDS,
} from "@/lib/constants/stock-movement";
import { cn } from "@/lib/utils";
import {
  defaultStockMovementFormValues,
  stockMovementFormSchema,
  type StockMovementFormValues,
} from "@/schemas/stock-movement";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

type StockMovementModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
  branchId: string;
  onSuccess?: () => void;
};

export function StockMovementModal({
  open,
  onOpenChange,
  partId,
  branchId,
  onSuccess,
}: StockMovementModalProps) {
  const router = useRouter();
  const [options, setOptions] = useState<StockMovementFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: defaultStockMovementFormValues(),
  });

  const kind = useWatch({ control, name: "kind" });

  useEffect(() => {
    if (!open) {
      setOptions(null);
      reset(defaultStockMovementFormValues());
      return;
    }

    let cancelled = false;
    setLoadingOptions(true);

    getStockMovementFormOptions(partId, branchId)
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Form verileri yüklenemedi",
          );
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, partId, branchId, onOpenChange, reset]);

  const quantityLabel = useMemo(() => {
    if (kind === "adjustment") {
      return "Sayım Sonucu (yeni miktar)";
    }
    return "Miktar";
  }, [kind]);

  const quantityHint = useMemo(() => {
    if (!options) return null;
    const current = formatStockQuantity(options.current_quantity, options.unit);
    if (kind === "adjustment") {
      return `Mevcut stok: ${current}`;
    }
    if (kind === "out" || kind === "transfer") {
      return `Mevcut stok: ${current}`;
    }
    return null;
  }, [kind, options]);

  async function onSubmit(values: StockMovementFormValues) {
    if (!options) return;

    if (
      values.kind === "transfer" &&
      values.target_branch_id === options.branch_id
    ) {
      toast.error("Kaynak ve hedef şube farklı olmalıdır");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createStockMovement({
        kind: values.kind,
        part_id: options.part_id,
        branch_id: options.branch_id,
        quantity: values.quantity,
        reason: values.reason.trim(),
        movement_date: values.movement_date,
        work_order_id: values.work_order_id?.trim()
          ? values.work_order_id
          : null,
        target_branch_id:
          values.kind === "transfer" && values.target_branch_id?.trim()
            ? values.target_branch_id
            : null,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Hareket kaydedildi");
      onSuccess?.();
      router.refresh();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void handleSubmit(onSubmit)(event);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Stok Hareketi Ekle</DialogTitle>
          <DialogDescription>
            {options ? (
              <>
                <span className="font-mono font-medium">{options.part_code}</span>
                {" · "}
                {options.description}
                <br />
                Şube: {options.branch_name} ({options.branch_code})
              </>
            ) : (
              "Ürün bilgileri yükleniyor…"
            )}
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Yükleniyor…
          </div>
        ) : options ? (
          <form
            onSubmit={handleFormSubmit}
            onClick={(event) => event.stopPropagation()}
            className="space-y-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="movement-kind">Hareket Tipi *</FieldLabel>
                <Controller
                  control={control}
                  name="kind"
                  render={({ field }) => (
                    <select
                      id="movement-kind"
                      className={selectClassName}
                      disabled={isSubmitting}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {STOCK_MOVEMENT_KINDS.map((value) => (
                        <option key={value} value={value}>
                          {STOCK_MOVEMENT_KIND_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.kind ? <FieldError>{errors.kind.message}</FieldError> : null}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="movement-quantity">
                    {quantityLabel} *
                  </FieldLabel>
                  <Input
                    id="movement-quantity"
                    type="number"
                    min={kind === "adjustment" ? 0 : 1}
                    step="any"
                    className="h-10 tabular-nums"
                    disabled={isSubmitting}
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {quantityHint ? (
                    <p className="text-xs text-muted-foreground">{quantityHint}</p>
                  ) : null}
                  {errors.quantity ? (
                    <FieldError>{errors.quantity.message}</FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="movement-date">Tarih *</FieldLabel>
                  <Input
                    id="movement-date"
                    type="date"
                    className="h-10"
                    disabled={isSubmitting}
                    {...register("movement_date")}
                  />
                  {errors.movement_date ? (
                    <FieldError>{errors.movement_date.message}</FieldError>
                  ) : null}
                </Field>
              </div>

              {kind === "transfer" ? (
                <Field>
                  <FieldLabel htmlFor="target-branch">Hedef Şube *</FieldLabel>
                  <Controller
                    control={control}
                    name="target_branch_id"
                    render={({ field }) => (
                      <select
                        id="target-branch"
                        className={selectClassName}
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      >
                        <option value="">Hedef şube seçin</option>
                        {options.target_branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.target_branch_id ? (
                    <FieldError>{errors.target_branch_id.message}</FieldError>
                  ) : null}
                  {options.target_branches.length === 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Transfer için başka aktif şube bulunamadı.
                    </p>
                  ) : null}
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="movement-reason">Sebep / Açıklama *</FieldLabel>
                <Input
                  id="movement-reason"
                  placeholder="Örn. Satın alma, sayım düzeltme"
                  className="h-10"
                  disabled={isSubmitting}
                  {...register("reason")}
                />
                {errors.reason ? (
                  <FieldError>{errors.reason.message}</FieldError>
                ) : null}
              </Field>

              {kind !== "transfer" && kind !== "adjustment" ? (
                <Field>
                  <FieldLabel htmlFor="work-order">İlgili İş Emri</FieldLabel>
                  <Controller
                    control={control}
                    name="work_order_id"
                    render={({ field }) => (
                      <select
                        id="work-order"
                        className={selectClassName}
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      >
                        <option value="">İş emri seçilmedi</option>
                        {options.work_orders.map((workOrder) => (
                          <option key={workOrder.id} value={workOrder.id}>
                            {workOrder.work_order_number}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </Field>
              ) : null}
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <SubmitButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Kaydediliyor…"
                className="sm:w-auto"
                disabled={
                  kind === "transfer" && options.target_branches.length === 0
                }
                onClick={(event) => event.stopPropagation()}
              >
                Kaydet
              </SubmitButton>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
