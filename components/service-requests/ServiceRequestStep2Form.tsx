"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { ServiceRequestPhotos } from "@/components/service-requests/ServiceRequestPhotos";
import { textareaClassName } from "@/components/service-requests/service-request-form-styles";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { advanceServiceRequestFromStep2 } from "@/lib/api/service-requests/advance-service-request";
import { updateServiceRequestStep2 } from "@/lib/api/service-requests/update-service-request-step-2";
import type {
  DeleteServiceRequestPhotoAction,
  GetServiceRequestPhotoUrlAction,
  ServiceRequestDetail,
  UploadServiceRequestPhotoAction,
} from "@/lib/api/service-requests/types";
import { cn } from "@/lib/utils";
import {
  updateServiceRequestStep2Schema,
  type UpdateServiceRequestStep2Input,
} from "@/schemas/service-request";

type ServiceRequestStep2FormProps = {
  serviceRequest: ServiceRequestDetail;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
};

function toDefaultValues(
  serviceRequest: ServiceRequestDetail,
): UpdateServiceRequestStep2Input {
  return {
    id: serviceRequest.id,
    diagnosed_fault: serviceRequest.diagnosed_fault ?? "",
    customer_statement: serviceRequest.customer_statement ?? "",
    technical_inspection_result:
      serviceRequest.technical_inspection_result ?? "",
    wrong_usage_detected: serviceRequest.wrong_usage_detected,
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateServiceRequestStep2Input>({
    resolver: zodResolver(updateServiceRequestStep2Schema),
    defaultValues: toDefaultValues(serviceRequest),
  });

  const wrongUsageDetected = watch("wrong_usage_detected");
  const showWarrantyBanner =
    serviceRequest.under_warranty && wrongUsageDetected;

  async function onSubmit(values: UpdateServiceRequestStep2Input) {
    setIsSubmitting(true);
    try {
      const saveResult = await updateServiceRequestStep2(values);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const advanceResult = await advanceServiceRequestFromStep2(serviceRequest.id);
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

      {showWarrantyBanner ? (
        <div
          className={cn(
            "flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950",
            "dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
          )}
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            Garanti kapsamı dışında — ücretli işlem devam edecek
          </p>
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

      <div className="flex justify-end">
        <SubmitButton
          isLoading={isSubmitting}
          loadingText="Kaydediliyor…"
          className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
        >
          Kaydet ve Devam Et
        </SubmitButton>
      </div>
    </form>
  );
}
