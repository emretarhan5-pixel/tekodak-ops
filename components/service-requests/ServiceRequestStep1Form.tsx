"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { createServiceRequest } from "@/lib/api/service-requests/create-service-request";
import type {
  ServiceRequestFormBranchOption,
  ServiceRequestFormDeviceModelOption,
} from "@/lib/api/service-requests/types";
import { cn } from "@/lib/utils";
import {
  serviceRequestStep1FormSchema,
  type ServiceRequestStep1FormValues,
} from "@/schemas/service-request";

const textareaClassName = cn(
  "flex min-h-[100px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

type ServiceRequestStep1FormProps = {
  branches: ServiceRequestFormBranchOption[];
  deviceModels: ServiceRequestFormDeviceModelOption[];
  technicianName: string;
  isAdmin: boolean;
  defaultBranchId?: string | null;
};

function emptyValues(defaultBranchId?: string | null): ServiceRequestStep1FormValues {
  return {
    branch_id: defaultBranchId ?? "",
    brand_model_mode: "catalog",
    company_name: "",
    contact_name: "",
    phone: "",
    address: "",
    device_type: "",
    brand_model: "",
    device_model_id: null,
    serial_number: "",
    under_warranty: false,
    reported_fault: "",
  };
}

export function ServiceRequestStep1Form({
  branches,
  deviceModels,
  technicianName,
  isAdmin,
  defaultBranchId,
}: ServiceRequestStep1FormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceRequestStep1FormValues>({
    resolver: zodResolver(serviceRequestStep1FormSchema),
    defaultValues: emptyValues(defaultBranchId),
  });

  const brandModelMode = watch("brand_model_mode");

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return deviceModels.slice(0, 50);
    return deviceModels
      .filter((model) => model.label.toLocaleLowerCase("tr-TR").includes(q))
      .slice(0, 50);
  }, [deviceModels, modelQuery]);

  async function onSubmit(values: ServiceRequestStep1FormValues) {
    if (isAdmin && !values.branch_id) {
      toast.error("Şube seçimi zorunludur");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createServiceRequest({
        branch_id: isAdmin ? values.branch_id || undefined : undefined,
        company_name: values.company_name,
        contact_name: values.contact_name,
        phone: values.phone,
        address: values.address,
        device_type: values.device_type,
        brand_model: values.brand_model,
        device_model_id:
          values.brand_model_mode === "catalog" ? values.device_model_id : null,
        serial_number: values.serial_number,
        under_warranty: values.under_warranty,
        reported_fault: values.reported_fault,
      });

      if (!result.success) {
        toast.error(result.error ?? "Kayıt oluşturulamadı");
        return;
      }

      toast.success(`Servis talebi oluşturuldu (${result.data.requestNumber})`);
      router.push(`/service-requests/${result.data.serviceRequestId}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Şube</CardTitle>
            <CardDescription>
              Servis talebinin bağlı olacağı şubeyi seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="branch_id">Şube *</FieldLabel>
              <select
                id="branch_id"
                className={selectClassName}
                disabled={isSubmitting}
                {...register("branch_id")}
              >
                <option value="">Şube seçin</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <FieldError errors={[errors.branch_id]} />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Müşteri bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="company_name">Firma / Kurum *</FieldLabel>
              <Input
                id="company_name"
                className="h-10"
                disabled={isSubmitting}
                {...register("company_name")}
              />
              <FieldError errors={[errors.company_name]} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="contact_name">Ad Soyad *</FieldLabel>
                <Input
                  id="contact_name"
                  className="h-10"
                  disabled={isSubmitting}
                  {...register("contact_name")}
                />
                <FieldError errors={[errors.contact_name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Telefon *</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  className="h-10"
                  disabled={isSubmitting}
                  {...register("phone")}
                />
                <FieldError errors={[errors.phone]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="address">Adres *</FieldLabel>
              <textarea
                id="address"
                className={textareaClassName}
                rows={3}
                disabled={isSubmitting}
                {...register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cihaz bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="device_type">Cihaz türü *</FieldLabel>
              <Input
                id="device_type"
                className="h-10"
                placeholder="Örn. Kompresör, Kurutucu"
                disabled={isSubmitting}
                {...register("device_type")}
              />
              <FieldError errors={[errors.device_type]} />
            </Field>

            <Field>
              <FieldLabel>Marka / Model *</FieldLabel>
              <Controller
                control={control}
                name="brand_model_mode"
                render={({ field }) => (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={field.value === "catalog" ? "default" : "outline"}
                      disabled={isSubmitting}
                      onClick={() => {
                        field.onChange("catalog");
                        setValue("brand_model", "");
                        setValue("device_model_id", null);
                        setModelQuery("");
                      }}
                    >
                      Listeden seç
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={field.value === "manual" ? "default" : "outline"}
                      disabled={isSubmitting}
                      onClick={() => {
                        field.onChange("manual");
                        setValue("device_model_id", null);
                        setModelQuery("");
                      }}
                    >
                      Manuel giriş
                    </Button>
                  </div>
                )}
              />

              {brandModelMode === "catalog" ? (
                <Controller
                  control={control}
                  name="device_model_id"
                  render={({ field }) => (
                    <div ref={modelPickerRef} className="relative">
                      <div className="relative">
                        <Input
                          className="h-10 pr-9"
                          placeholder="Marka veya model ara…"
                          value={modelQuery}
                          disabled={isSubmitting}
                          onChange={(e) => {
                            setModelQuery(e.target.value);
                            setModelOpen(true);
                            if (!e.target.value.trim()) {
                              field.onChange(null);
                              setValue("brand_model", "");
                            }
                          }}
                          onFocus={() => setModelOpen(true)}
                          onBlur={() => {
                            setTimeout(() => setModelOpen(false), 150);
                          }}
                          autoComplete="off"
                        />
                        <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      {modelOpen && filteredModels.length > 0 ? (
                        <ul
                          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-md"
                          role="listbox"
                        >
                          {filteredModels.map((model) => (
                            <li key={model.id}>
                              <button
                                type="button"
                                role="option"
                                className={cn(
                                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                                  field.value === model.id && "bg-muted/60",
                                )}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  field.onChange(model.id);
                                  setValue("brand_model", model.label);
                                  setModelQuery(model.label);
                                  setModelOpen(false);
                                }}
                              >
                                {field.value === model.id ? (
                                  <Check className="size-4 shrink-0 text-primary" />
                                ) : (
                                  <span className="size-4 shrink-0" />
                                )}
                                {model.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {modelOpen &&
                      modelQuery.trim() &&
                      filteredModels.length === 0 ? (
                        <p className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-md">
                          Eşleşen model bulunamadı — manuel girişi deneyin
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              ) : (
                <Input
                  className="h-10"
                  placeholder="Marka ve model adını yazın"
                  disabled={isSubmitting}
                  {...register("brand_model")}
                />
              )}
              <FieldError
                errors={[errors.device_model_id, errors.brand_model]}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="serial_number">Seri no *</FieldLabel>
              <Input
                id="serial_number"
                className="h-10 font-mono"
                disabled={isSubmitting}
                {...register("serial_number")}
              />
              <FieldError errors={[errors.serial_number]} />
            </Field>

            <Field>
              <FieldLabel>Garanti *</FieldLabel>
              <Controller
                control={control}
                name="under_warranty"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        className="size-4 accent-primary"
                        checked={field.value === true}
                        disabled={isSubmitting}
                        onChange={() => field.onChange(true)}
                      />
                      Evet
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        className="size-4 accent-primary"
                        checked={field.value === false}
                        disabled={isSubmitting}
                        onChange={() => field.onChange(false)}
                      />
                      Hayır
                    </label>
                  </div>
                )}
              />
              <FieldError errors={[errors.under_warranty]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arıza bilgisi</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="reported_fault">Bildirilen arıza *</FieldLabel>
              <textarea
                id="reported_fault"
                className={textareaClassName}
                rows={4}
                disabled={isSubmitting}
                {...register("reported_fault")}
              />
              <FieldError errors={[errors.reported_fault]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="technician">Sorumlu teknisyen</FieldLabel>
              <Input
                id="technician"
                className="h-10 bg-muted/40"
                value={technicianName}
                readOnly
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-11 w-full sm:w-auto"
          disabled={isSubmitting}
          onClick={() => router.push("/service-requests")}
        >
          İptal
        </Button>
        <SubmitButton
          isLoading={isSubmitting}
          loadingText="Kaydediliyor…"
          className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
        >
          Servis Talebini Oluştur
        </SubmitButton>
      </div>
    </form>
  );
}
