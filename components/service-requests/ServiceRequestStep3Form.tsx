"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { ServiceRequestQuoteLines } from "@/components/service-requests/ServiceRequestQuoteLines";
import {
  formatServiceRequestMoney,
  selectClassName,
} from "@/components/service-requests/service-request-form-styles";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { calculateQuoteTotals } from "@/lib/utils/service-request-quote";
import { submitServiceRequestCustomerDecision } from "@/lib/api/service-requests/update-service-request-step-3";
import { updateServiceRequestStep3 } from "@/lib/api/service-requests/update-service-request-step-3";
import type { ServiceRequestDetail } from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_CUSTOMER_DECISION_LABELS,
  SERVICE_REQUEST_VAT_OPTION_LABELS,
  SERVICE_REQUEST_VAT_OPTIONS,
} from "@/lib/constants/service-request";
import { cn } from "@/lib/utils";
import {
  serviceRequestCustomerDecisionSchema,
  updateServiceRequestStep3Schema,
  type ServiceRequestCustomerDecisionInput,
  type UpdateServiceRequestStep3Input,
} from "@/schemas/service-request";

type ServiceRequestStep3FormProps = {
  serviceRequest: ServiceRequestDetail;
};

function toDefaultValues(
  serviceRequest: ServiceRequestDetail,
): UpdateServiceRequestStep3Input {
  return {
    id: serviceRequest.id,
    quote_lines:
      serviceRequest.quote_lines.length > 0
        ? serviceRequest.quote_lines.map((line) => ({
            description: line.description,
            unit_price: line.unit_price,
            quantity: line.quantity,
          }))
        : [{ description: "", unit_price: 0, quantity: 1 }],
    labor_cost: serviceRequest.labor_cost ?? 0,
    shipping_cost: serviceRequest.shipping_cost ?? null,
    vat_option: serviceRequest.vat_option ?? "vat_20",
    quote_sent_to_customer: serviceRequest.quote_sent_to_customer,
  };
}

export function ServiceRequestStep3Form({
  serviceRequest,
}: ServiceRequestStep3FormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [customerDecision, setCustomerDecision] = useState<
    "approved" | "rejected" | ""
  >("");
  const [deviceReturned, setDeviceReturned] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateServiceRequestStep3Input>({
    resolver: zodResolver(updateServiceRequestStep3Schema),
    defaultValues: toDefaultValues(serviceRequest),
  });

  const watchedValues = watch();
  const totals = useMemo(
    () =>
      calculateQuoteTotals({
        quoteLines: watchedValues.quote_lines ?? [],
        laborCost: Number(watchedValues.labor_cost ?? 0),
        shippingCost: watchedValues.shipping_cost,
        vatOption: watchedValues.vat_option ?? "vat_20",
      }),
    [watchedValues],
  );

  async function onSaveQuote(values: UpdateServiceRequestStep3Input) {
    setIsSaving(true);
    try {
      const result = await updateServiceRequestStep3(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Teklif kaydedildi");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  }

  async function onSubmitDecision() {
    setDecisionError(null);

    if (!customerDecision) {
      setDecisionError("Müşteri kararı seçin");
      return;
    }

    const decisionInput: ServiceRequestCustomerDecisionInput = {
      id: serviceRequest.id,
      customer_decision: customerDecision,
      device_returned: customerDecision === "rejected" ? deviceReturned : undefined,
    };

    const parsed = serviceRequestCustomerDecisionSchema.safeParse(decisionInput);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Müşteri kararı geçersiz";
      setDecisionError(message);
      return;
    }

    setIsSubmittingDecision(true);
    try {
      const result = await submitServiceRequestCustomerDecision(parsed.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.status === "rejected") {
        toast.success("Teklif reddedildi, talep kapatıldı");
      } else {
        toast.success("Teklif onaylandı, bakım adımına geçildi");
      }
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit(onSaveQuote)}
        className="space-y-6"
        noValidate
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Teklif Satırları</p>
            <p className="text-sm text-muted-foreground">
              Parça ve hizmet kalemlerini ekleyin
            </p>
          </div>
          <ServiceRequestQuoteLines
            control={control}
            errors={errors}
            disabled={isSaving || isSubmittingDecision}
          />
        </div>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="labor_cost">İşçilik Ücreti *</FieldLabel>
            <Input
              id="labor_cost"
              type="number"
              min={0}
              step="0.01"
              className="h-10 tabular-nums"
              disabled={isSaving || isSubmittingDecision}
              {...register("labor_cost", { valueAsNumber: true })}
            />
            {errors.labor_cost ? (
              <FieldError>{errors.labor_cost.message}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="shipping_cost">Kargo Ücreti</FieldLabel>
            <Input
              id="shipping_cost"
              type="number"
              min={0}
              step="0.01"
              className="h-10 tabular-nums"
              disabled={isSaving || isSubmittingDecision}
              {...register("shipping_cost", {
                setValueAs: (value) =>
                  value === "" || value == null ? null : Number(value),
              })}
            />
            {errors.shipping_cost ? (
              <FieldError>{errors.shipping_cost.message}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <Field>
          <FieldLabel htmlFor="vat_option">KDV Seçeneği *</FieldLabel>
          <select
            id="vat_option"
            className={selectClassName}
            disabled={isSaving || isSubmittingDecision}
            {...register("vat_option")}
          >
            {SERVICE_REQUEST_VAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SERVICE_REQUEST_VAT_OPTION_LABELS[option]}
              </option>
            ))}
          </select>
          {errors.vat_option ? (
            <FieldError>{errors.vat_option.message}</FieldError>
          ) : null}
        </Field>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Ara toplam</span>
            <span className="text-sm tabular-nums">
              {formatServiceRequestMoney(totals.quoteSubtotal)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-2">
            <span className="font-medium">Toplam</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatServiceRequestMoney(totals.quoteTotal)}
            </span>
          </div>
        </div>

        <Field>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              disabled={isSaving || isSubmittingDecision}
              {...register("quote_sent_to_customer")}
            />
            <span className="text-sm">Müşteriye iletildi mi?</span>
          </label>
        </Field>

        <div className="flex justify-end">
          <SubmitButton
            isLoading={isSaving}
            loadingText="Kaydediliyor…"
            className="h-11 min-h-11 w-full sm:w-auto"
          >
            Teklifi Kaydet
          </SubmitButton>
        </div>
      </form>

      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <p className="text-sm font-medium">Müşteri Kararı</p>
          <p className="text-sm text-muted-foreground">
            Teklifi kaydettikten sonra müşteri yanıtını işleyin
          </p>
        </div>

        <div className="space-y-3">
          {(["approved", "rejected"] as const).map((decision) => (
            <label
              key={decision}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                customerDecision === decision
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <input
                type="radio"
                name="customer_decision"
                className="mt-1"
                disabled={isSubmittingDecision}
                checked={customerDecision === decision}
                onChange={() => {
                  setCustomerDecision(decision);
                  setDecisionError(null);
                  if (decision !== "rejected") {
                    setDeviceReturned(false);
                  }
                }}
              />
              <span className="text-sm font-medium">
                {SERVICE_REQUEST_CUSTOMER_DECISION_LABELS[decision]}
              </span>
            </label>
          ))}
        </div>

        {customerDecision === "rejected" ? (
          <Field>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-border"
                disabled={isSubmittingDecision}
                checked={deviceReturned}
                onChange={(event) => setDeviceReturned(event.target.checked)}
              />
              <span className="text-sm">Cihaz iade edildi *</span>
            </label>
          </Field>
        ) : null}

        {decisionError ? <FieldError>{decisionError}</FieldError> : null}

        <div className="flex justify-end">
          <Button
            type="button"
            className="h-11 min-h-11 w-full sm:w-auto"
            disabled={isSubmittingDecision}
            onClick={() => void onSubmitDecision()}
          >
            {isSubmittingDecision ? "İşleniyor…" : "Kararı Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
