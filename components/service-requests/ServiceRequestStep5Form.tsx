"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { closeServiceRequest } from "@/lib/api/service-requests/update-service-request-step-5";
import type { ServiceRequestDetail } from "@/lib/api/service-requests/types";
import { cn } from "@/lib/utils";

type Step5FormValues = {
  invoice_issued: boolean;
  invoice_number: string;
  payment_received: boolean;
};

type ServiceRequestStep5FormProps = {
  serviceRequest: ServiceRequestDetail;
};

function toDefaultValues(serviceRequest: ServiceRequestDetail): Step5FormValues {
  return {
    invoice_issued: serviceRequest.invoice_issued,
    invoice_number: serviceRequest.invoice_number ?? "",
    payment_received: serviceRequest.payment_received,
  };
}

export function ServiceRequestStep5Form({
  serviceRequest,
}: ServiceRequestStep5FormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(
    serviceRequest.status === "tamamlandi",
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<Step5FormValues>({
    defaultValues: toDefaultValues(serviceRequest),
  });

  async function onSubmit(values: Step5FormValues) {
    const invoiceNumber = values.invoice_number.trim();
    if (!invoiceNumber) {
      setError("invoice_number", {
        message: "Fatura numarası girilmeden iş kapatılamaz",
      });
      toast.error("Fatura numarası girilmeden iş kapatılamaz");
      return;
    }

    if (!values.payment_received) {
      toast.error("Ödeme alınmadan iş kapatılamaz");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await closeServiceRequest({
        id: serviceRequest.id,
        invoice_issued: values.invoice_issued,
        invoice_number: invoiceNumber,
        payment_received: true,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setShowSuccess(true);
      toast.success("Servis talebi başarıyla kapatıldı");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showSuccess || serviceRequest.status === "tamamlandi") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center",
          "dark:border-emerald-900 dark:bg-emerald-950/40",
        )}
      >
        <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
            İş başarıyla tamamlandı
          </h3>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
            {serviceRequest.request_number} numaralı servis talebi kapatıldı.
          </p>
          {serviceRequest.invoice_number ? (
            <p className="text-sm text-muted-foreground">
              Fatura No:{" "}
              <span className="font-mono">{serviceRequest.invoice_number}</span>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FieldGroup className="space-y-4">
        <Field>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              disabled={isSubmitting}
              {...register("invoice_issued")}
            />
            <span className="text-sm">Fatura kesildi mi?</span>
          </label>
        </Field>

        <Field>
          <FieldLabel htmlFor="invoice_number">Fatura No *</FieldLabel>
          <Input
            id="invoice_number"
            className="h-10 font-mono"
            disabled={isSubmitting}
            placeholder="Örn. FTR-2026-001"
            {...register("invoice_number")}
          />
          {errors.invoice_number ? (
            <FieldError>{errors.invoice_number.message}</FieldError>
          ) : null}
        </Field>

        <Field>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              disabled={isSubmitting}
              {...register("payment_received")}
            />
            <span className="text-sm">Ödeme alındı mı? *</span>
          </label>
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <SubmitButton
          isLoading={isSubmitting}
          loadingText="Kapatılıyor…"
          className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
        >
          İşi Kapat
        </SubmitButton>
      </div>
    </form>
  );
}
