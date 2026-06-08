"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { ServiceRequestPhotos } from "@/components/service-requests/ServiceRequestPhotos";
import {
  selectClassName,
  textareaClassName,
} from "@/components/service-requests/service-request-form-styles";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { findOrCreateDeviceForScrap } from "@/lib/api/devices/find-or-create-device-for-scrap";
import { advanceServiceRequestFromStep2 } from "@/lib/api/service-requests/advance-service-request";
import { submitServiceRequestScrapFromStep2 } from "@/lib/api/service-requests/submit-service-request-scrap-from-step-2";
import { updateServiceRequestStep2 } from "@/lib/api/service-requests/update-service-request-step-2";
import type {
  DeleteServiceRequestPhotoAction,
  GetServiceRequestPhotoUrlAction,
  ServiceRequestDetail,
  UploadServiceRequestPhotoAction,
} from "@/lib/api/service-requests/types";
import {
  DEVICE_SCRAP_NEXT_STEP_LABELS,
  DEVICE_SCRAP_REASON_LABELS,
} from "@/lib/constants/device-scrap";
import { cn } from "@/lib/utils";
import {
  submitServiceRequestScrapFromStep2Schema,
  updateServiceRequestStep2FormSchema,
  type UpdateServiceRequestStep2FormInput,
} from "@/schemas/service-request";

type ServiceRequestStep2FormProps = {
  serviceRequest: ServiceRequestDetail;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
};

function toDefaultValues(
  serviceRequest: ServiceRequestDetail,
): UpdateServiceRequestStep2FormInput {
  return {
    id: serviceRequest.id,
    diagnosed_fault: serviceRequest.diagnosed_fault ?? "",
    customer_statement: serviceRequest.customer_statement ?? "",
    technical_inspection_result:
      serviceRequest.technical_inspection_result ?? "",
    wrong_usage_detected: serviceRequest.wrong_usage_detected,
    mark_as_scrap: false,
    scrap_reason: null,
    scrap_notes: null,
    scrap_next_step: null,
  };
}

export function ServiceRequestStep2Form({
  serviceRequest,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
}: ServiceRequestStep2FormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrapLoading, setScrapLoading] = useState(false);
  const [scrapReady, setScrapReady] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<UpdateServiceRequestStep2FormInput>({
    resolver: zodResolver(updateServiceRequestStep2FormSchema),
    defaultValues: toDefaultValues(serviceRequest),
  });

  const wrongUsageDetected = watch("wrong_usage_detected");
  const markAsScrap = watch("mark_as_scrap");
  const showWarrantyBanner =
    serviceRequest.under_warranty && wrongUsageDetected;

  async function handleMarkAsScrapChange(checked: boolean) {
    setValue("mark_as_scrap", checked, { shouldDirty: true });

    if (!checked) {
      setScrapReady(false);
      setValue("scrap_reason", null);
      setValue("scrap_notes", null);
      setValue("scrap_next_step", null);
      return;
    }

    setScrapLoading(true);
    setScrapReady(false);

    try {
      const saveResult = await updateServiceRequestStep2({
        id: serviceRequest.id,
        diagnosed_fault: getValues("diagnosed_fault"),
        customer_statement: getValues("customer_statement"),
        technical_inspection_result: getValues("technical_inspection_result"),
        wrong_usage_detected: getValues("wrong_usage_detected"),
      });

      if (!saveResult.success) {
        toast.error(saveResult.error);
        setValue("mark_as_scrap", false);
        return;
      }

      const result = await findOrCreateDeviceForScrap(serviceRequest.id);
      if (!result.success) {
        toast.error(result.error);
        setValue("mark_as_scrap", false);
        return;
      }

      if (result.data.created) {
        toast.info(
          `ℹ️ ${result.data.serialNumber} seri numaralı cihaz sisteme eklendi.`,
        );
      }

      setScrapReady(true);
    } catch {
      toast.error("Cihaz kaydı sırasında beklenmeyen bir hata oluştu");
      setValue("mark_as_scrap", false);
    } finally {
      setScrapLoading(false);
    }
  }

  function handleCancelScrap() {
    setValue("mark_as_scrap", false, { shouldDirty: true });
    setValue("scrap_reason", null);
    setValue("scrap_notes", null);
    setValue("scrap_next_step", null);
    setScrapReady(false);
  }

  async function onSubmit(values: UpdateServiceRequestStep2FormInput) {
    setIsSubmitting(true);
    try {
      const saveResult = await updateServiceRequestStep2(values);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const advanceResult = await advanceServiceRequestFromStep2(
        serviceRequest.id,
      );
      if (!advanceResult.success) {
        toast.error(advanceResult.error);
        return;
      }

      toast.success("Arıza tespiti kaydedildi, teklif adımına geçildi");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitScrap() {
    const values = getValues();
    const parsed = submitServiceRequestScrapFromStep2Schema.safeParse({
      id: values.id,
      diagnosed_fault: values.diagnosed_fault,
      customer_statement: values.customer_statement,
      technical_inspection_result: values.technical_inspection_result,
      wrong_usage_detected: values.wrong_usage_detected,
      scrap_reason: values.scrap_reason,
      scrap_notes: values.scrap_notes,
      scrap_next_step: values.scrap_next_step,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "Lütfen hek alanlarını kontrol edin");
      return;
    }

    if (!scrapReady) {
      toast.error("Önce cihaz kaydı tamamlanmalıdır");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitServiceRequestScrapFromStep2(parsed.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Hek talebi gönderildi, süreç kapatıldı");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  const scrapFieldsDisabled = isSubmitting || scrapLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FieldGroup className="space-y-4">
        <Field>
          <FieldLabel htmlFor="diagnosed_fault">Tespit Edilen Arıza *</FieldLabel>
          <textarea
            id="diagnosed_fault"
            className={textareaClassName}
            rows={4}
            disabled={isSubmitting}
            {...register("diagnosed_fault")}
          />
          {errors.diagnosed_fault ? (
            <FieldError>{errors.diagnosed_fault.message}</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="customer_statement">Müşteri Beyanı *</FieldLabel>
          <textarea
            id="customer_statement"
            className={textareaClassName}
            rows={4}
            disabled={isSubmitting}
            {...register("customer_statement")}
          />
          {errors.customer_statement ? (
            <FieldError>{errors.customer_statement.message}</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="technical_inspection_result">
            Teknik İnceleme Sonucu *
          </FieldLabel>
          <textarea
            id="technical_inspection_result"
            className={textareaClassName}
            rows={4}
            disabled={isSubmitting}
            {...register("technical_inspection_result")}
          />
          {errors.technical_inspection_result ? (
            <FieldError>{errors.technical_inspection_result.message}</FieldError>
          ) : null}
        </Field>

        <Field>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              disabled={isSubmitting}
              {...register("wrong_usage_detected")}
            />
            <span className="text-sm">Yanlış kullanım tespiti</span>
          </label>
        </Field>
      </FieldGroup>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">⚠️ Makine Heke Ayrılıyor mu?</p>

        <Field>
          <label
            className={cn(
              "flex items-start gap-3",
              scrapLoading ? "cursor-wait opacity-70" : "cursor-pointer",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              checked={markAsScrap}
              disabled={scrapFieldsDisabled}
              onChange={(e) => void handleMarkAsScrapChange(e.target.checked)}
            />
            <span className="text-sm">
              {scrapLoading
                ? "Cihaz kaydı kontrol ediliyor…"
                : "Bu makineyi hek olarak işaretle"}
            </span>
          </label>
        </Field>

        {markAsScrap && scrapReady ? (
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="scrap_reason">Hek Nedeni *</FieldLabel>
              <select
                id="scrap_reason"
                className={selectClassName}
                disabled={scrapFieldsDisabled}
                {...register("scrap_reason")}
              >
                <option value="" disabled>
                  Seçin…
                </option>
                {Object.entries(DEVICE_SCRAP_REASON_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              {errors.scrap_reason ? (
                <FieldError>{errors.scrap_reason.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="scrap_notes">Açıklama *</FieldLabel>
              <textarea
                id="scrap_notes"
                className={textareaClassName}
                rows={4}
                disabled={scrapFieldsDisabled}
                placeholder="Hek nedenini detaylı açıklayın..."
                {...register("scrap_notes")}
              />
              {errors.scrap_notes ? (
                <FieldError>{errors.scrap_notes.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="scrap_next_step">Müşteriye Öneri *</FieldLabel>
              <select
                id="scrap_next_step"
                className={selectClassName}
                disabled={scrapFieldsDisabled}
                {...register("scrap_next_step")}
              >
                <option value="" disabled>
                  Seçin…
                </option>
                {Object.entries(DEVICE_SCRAP_NEXT_STEP_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Bu öneri şimdilik yalnızca not olarak kaydedilir. İleride teklif
                modülüne bağlanacak.
              </p>
              {errors.scrap_next_step ? (
                <FieldError>{errors.scrap_next_step.message}</FieldError>
              ) : null}
            </Field>

            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              ⚠️ Hek talebi admin onayına gönderilecek. Onaylanana kadar cihaz
              aktif kalır. Onaylanırsa cihaz kalıcı olarak hek olur.
            </div>
          </FieldGroup>
        ) : null}
      </div>

      {showWarrantyBanner ? (
        <div
          className={cn(
            "flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950",
            "dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
          )}
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>Garanti kapsamı dışında — ücretli işlem devam edecek</p>
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Fotoğraflar</p>
          <p className="text-sm text-muted-foreground">
            Arıza tespitine ait görselleri yükleyin
          </p>
        </div>
        <ServiceRequestPhotos
          serviceRequestId={serviceRequest.id}
          step={2}
          photos={serviceRequest.photos}
          canEdit
          uploadPhotoAction={uploadPhotoAction}
          deletePhotoAction={deletePhotoAction}
          getPhotoUrlAction={getPhotoUrlAction}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {markAsScrap && scrapReady ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="h-11 min-h-11 w-full sm:w-auto"
              onClick={handleCancelScrap}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
              onClick={() => void handleSubmitScrap()}
            >
              {isSubmitting ? "Gönderiliyor…" : "Hek Talebini Gönder"}
            </Button>
          </>
        ) : (
          <SubmitButton
            isLoading={isSubmitting}
            loadingText="Kaydediliyor…"
            className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
          >
            Kaydet ve Devam Et
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
