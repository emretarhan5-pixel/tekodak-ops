"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Control, FieldErrors } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatServiceRequestMoney } from "@/components/service-requests/service-request-form-styles";
import type { UpdateServiceRequestStep3Input } from "@/schemas/service-request";

type ServiceRequestQuoteLinesProps = {
  control: Control<UpdateServiceRequestStep3Input>;
  errors: FieldErrors<UpdateServiceRequestStep3Input>;
  disabled?: boolean;
};

export function ServiceRequestQuoteLines({
  control,
  errors,
  disabled = false,
}: ServiceRequestQuoteLinesProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "quote_lines",
  });
  const quoteLines = useWatch({ control, name: "quote_lines" });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const lineErrors = errors.quote_lines?.[index];
        const unitPrice = quoteLines?.[index]?.unit_price;
        const quantity = quoteLines?.[index]?.quantity;
        const lineTotal =
          Number(unitPrice ?? 0) * Number(quantity ?? 0);

        return (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Satır {index + 1}</p>
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Sil</span>
                </Button>
              ) : null}
            </div>

            <Field>
              <FieldLabel htmlFor={`quote-line-desc-${index}`}>Açıklama *</FieldLabel>
              <Input
                id={`quote-line-desc-${index}`}
                className="h-10"
                disabled={disabled}
                {...control.register(`quote_lines.${index}.description`)}
              />
              {lineErrors?.description ? (
                <FieldError>{lineErrors.description.message}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor={`quote-line-price-${index}`}>
                  Birim Fiyat *
                </FieldLabel>
                <Input
                  id={`quote-line-price-${index}`}
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-10 tabular-nums"
                  disabled={disabled}
                  {...control.register(`quote_lines.${index}.unit_price`, {
                    valueAsNumber: true,
                  })}
                />
                {lineErrors?.unit_price ? (
                  <FieldError>{lineErrors.unit_price.message}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor={`quote-line-qty-${index}`}>Adet *</FieldLabel>
                <Input
                  id={`quote-line-qty-${index}`}
                  type="number"
                  min={0.01}
                  step="any"
                  className="h-10 tabular-nums"
                  disabled={disabled}
                  {...control.register(`quote_lines.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
                {lineErrors?.quantity ? (
                  <FieldError>{lineErrors.quantity.message}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel>Toplam</FieldLabel>
                <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm font-medium tabular-nums">
                  {formatServiceRequestMoney(lineTotal || 0)}
                </div>
              </Field>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 sm:w-auto"
        disabled={disabled}
        onClick={() =>
          append({
            description: "",
            unit_price: 0,
            quantity: 1,
          })
        }
      >
        <Plus className="size-4" />
        Satır Ekle
      </Button>

      {errors.quote_lines?.message ? (
        <FieldError>{errors.quote_lines.message}</FieldError>
      ) : null}
    </div>
  );
}
