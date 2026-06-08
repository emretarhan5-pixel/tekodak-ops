"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { ServiceRequestParts } from "@/components/service-requests/ServiceRequestParts";
import { ServiceRequestPhotos } from "@/components/service-requests/ServiceRequestPhotos";
import {
  selectClassName,
  textareaClassName,
} from "@/components/service-requests/service-request-form-styles";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { completeServiceRequestMaintenance } from "@/lib/api/service-requests/advance-service-request";
import { updateServiceRequestStep4 } from "@/lib/api/service-requests/update-service-request-step-4";
import type {
  AddServiceRequestPartAction,
  DeleteServiceRequestPhotoAction,
  GetServiceRequestPhotoUrlAction,
  RemoveServiceRequestPartAction,
  ServiceRequestDetail,
  UploadServiceRequestPhotoAction,
} from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_DELIVERY_METHOD_LABELS,
  SERVICE_REQUEST_DELIVERY_METHODS,
} from "@/lib/constants/service-request";
import {
  updateServiceRequestStep4Schema,
  type UpdateServiceRequestStep4Input,
} from "@/schemas/service-request";

type ServiceRequestStep4FormProps = {
  serviceRequest: ServiceRequestDetail;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
  getPartOptionsAction: (serviceRequestId: string) => Promise<
    import("@/lib/api/service-requests/types").ServiceRequestPartOption[]
  >;
  addPartAction: AddServiceRequestPartAction;
  removePartAction: RemoveServiceRequestPartAction;
};

function toDefaultValues(
  serviceRequest: ServiceRequestDetail,
): UpdateServiceRequestStep4Input {
  return {
    id: serviceRequest.id,
    work_description: serviceRequest.work_description ?? "",
    delivery_method: serviceRequest.delivery_method ?? "on_site",
    delivered: serviceRequest.delivered,
  };
}

export function ServiceRequestStep4Form({
  serviceRequest,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
  getPartOptionsAction,
  addPartAction,
  removePartAction,
}: ServiceRequestStep4FormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateServiceRequestStep4Input>({
    resolver: zodResolver(updateServiceRequestStep4Schema),
    defaultValues: toDefaultValues(serviceRequest),
  });

  async function onSubmit(values: UpdateServiceRequestStep4Input) {
    setIsSubmitting(true);
    try {
      const saveResult = await updateServiceRequestStep4(values);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const completeResult = await completeServiceRequestMaintenance(
        serviceRequest.id,
      );
      if (!completeResult.success) {
        toast.error(completeResult.error);
        return;
      }

      toast.success("Bakım tamamlandı, fatura adımına geçildi");
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
          <FieldLabel htmlFor="work_description">
            Yapılan İşin Açıklaması *
          </FieldLabel>
          <textarea
            id="work_description"
            className={textareaClassName}
            rows={5}
            disabled={isSubmitting}
            {...register("work_description")}
          />
          {errors.work_description ? (
            <FieldError>{errors.work_description.message}</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="delivery_method">Teslim Şekli *</FieldLabel>
          <select
            id="delivery_method"
            className={selectClassName}
            disabled={isSubmitting}
            {...register("delivery_method")}
          >
            {SERVICE_REQUEST_DELIVERY_METHODS.map((method) => (
              <option key={method} value={method}>
                {SERVICE_REQUEST_DELIVERY_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
          {errors.delivery_method ? (
            <FieldError>{errors.delivery_method.message}</FieldError>
          ) : null}
        </Field>

        <Field>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              disabled={isSubmitting}
              {...register("delivered")}
            />
            <span className="text-sm">Teslim edildi</span>
          </label>
        </Field>
      </FieldGroup>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Kullanılan Parçalar</p>
          <p className="text-sm text-muted-foreground">
            Stoktan parça ekleyin; miktar otomatik düşülür
          </p>
        </div>
        <ServiceRequestParts
          serviceRequestId={serviceRequest.id}
          parts={serviceRequest.parts}
          canEdit
          getPartOptionsAction={getPartOptionsAction}
          addPartAction={addPartAction}
          removePartAction={removePartAction}
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Fotoğraflar</p>
          <p className="text-sm text-muted-foreground">
            Bakım / tamir sürecine ait görseller
          </p>
        </div>
        <ServiceRequestPhotos
          serviceRequestId={serviceRequest.id}
          step={4}
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
          Bakım Tamamlandı
        </SubmitButton>
      </div>
    </form>
  );
}
