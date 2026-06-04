"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addYears } from "date-fns";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { checkDeviceSerialAvailable } from "@/lib/api/devices/check-serial-available";
import { createDevice } from "@/lib/api/devices/create-device";
import { deviceDetailToFormValues } from "@/lib/api/devices/device-to-form-values";
import type { DeviceFormCustomerOption } from "@/lib/api/devices/get-device-form-options";
import type { BrandOption, DeviceDetail, DeviceModelOption } from "@/lib/api/devices/types";
import { updateDevice } from "@/lib/api/devices/update-device";
import {
  DEVICE_STATUSES,
  DEVICE_STATUS_LABELS,
  type DeviceStatus,
} from "@/lib/constants/device";
import { cn } from "@/lib/utils";
import { createDeviceSchema, type DeviceFormValues } from "@/schemas/device";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[100px] resize-y py-2.5",
);

type DeviceFormProps = {
  mode: "create" | "edit";
  initialData?: DeviceDetail | null;
  prefillCustomerId?: string | null;
  customers: DeviceFormCustomerOption[];
  brands: BrandOption[];
  models: DeviceModelOption[];
};

function emptyFormValues(): DeviceFormValues {
  return {
    customer_id: "",
    brand_id: "",
    model_id: "",
    serial_number: "",
    manufacturing_year: null,
    installation_date: null,
    warranty_end_date: null,
    location_address: "",
    status: "active" as DeviceStatus,
    notes: "",
  };
}

function computeWarrantyEnd(
  installationDate: string | null | undefined,
  warrantyYears: number | null | undefined,
): string | null {
  if (!installationDate || warrantyYears == null || warrantyYears <= 0) {
    return null;
  }
  const inst = new Date(installationDate);
  if (Number.isNaN(inst.getTime())) {
    return null;
  }
  return addYears(inst, warrantyYears).toISOString().slice(0, 10);
}

export function DeviceForm({
  mode,
  initialData = null,
  prefillCustomerId = null,
  customers,
  brands,
  models,
}: DeviceFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const deviceId = isEdit ? initialData?.id : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warrantyManual, setWarrantyManual] = useState(isEdit);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState(
    () => (isEdit && initialData ? initialData.customer_name : ""),
  );
  const customerPickerRef = useRef<HTMLDivElement>(null);
  const [serialCheck, setSerialCheck] = useState<{
    status: "idle" | "checking" | "available" | "taken";
    message?: string;
  }>({ status: "idle" });

  const resolvedDefaults = useMemo((): DeviceFormValues => {
    if (isEdit && initialData) {
      const mapped = deviceDetailToFormValues(initialData);
      const { id: _id, ...rest } = mapped;
      return { ...emptyFormValues(), ...rest };
    }
    const base = emptyFormValues();
    if (prefillCustomerId && customers.some((c) => c.id === prefillCustomerId)) {
      return { ...base, customer_id: prefillCustomerId };
    }
    return base;
  }, [isEdit, initialData, prefillCustomerId, customers]);

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: resolvedDefaults,
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset(resolvedDefaults);
    if (isEdit && initialData) {
      setCustomerQuery(initialData.customer_name);
      setWarrantyManual(true);
      return;
    }
    if (prefillCustomerId) {
      const match = customers.find((c) => c.id === prefillCustomerId);
      if (match) {
        setCustomerQuery(match.name);
      }
    }
  }, [reset, resolvedDefaults, isEdit, initialData, prefillCustomerId, customers]);

  const brandId = useWatch({ control, name: "brand_id" });
  const customerId = useWatch({ control, name: "customer_id" });
  const installationDate = useWatch({ control, name: "installation_date" });
  const serialNumber = useWatch({ control, name: "serial_number" });

  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === brandId),
    [brands, brandId],
  );

  const brandModels = useMemo(
    () => models.filter((m) => m.brand_id === brandId),
    [models, brandId],
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) {
      return customers.slice(0, 50);
    }
    return customers
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [customers, customerQuery]);

  useEffect(() => {
    if (selectedCustomer && !customerOpen) {
      setCustomerQuery(selectedCustomer.name);
    }
  }, [selectedCustomer, customerOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customerPickerRef.current &&
        !customerPickerRef.current.contains(e.target as Node)
      ) {
        setCustomerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (warrantyManual) {
      return;
    }
    const end = computeWarrantyEnd(
      installationDate,
      selectedBrand?.default_warranty_years,
    );
    if (end) {
      setValue("warranty_end_date", end, { shouldDirty: true });
    }
  }, [installationDate, selectedBrand, warrantyManual, setValue]);

  useEffect(() => {
    const trimmed = (serialNumber ?? "").trim();
    if (!trimmed) {
      setSerialCheck({ status: "idle" });
      return;
    }

    if (
      isEdit &&
      initialData &&
      trimmed === initialData.serial_number.trim()
    ) {
      setSerialCheck({ status: "idle" });
      return;
    }

    setSerialCheck({ status: "checking" });
    const timer = window.setTimeout(async () => {
      const result = await checkDeviceSerialAvailable(
        trimmed,
        isEdit ? deviceId : undefined,
      );
      if (result.available) {
        setSerialCheck({ status: "available" });
      } else {
        setSerialCheck({
          status: "taken",
          message: result.message,
        });
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [serialNumber, isEdit, initialData, deviceId]);

  function handleBrandChange(nextBrandId: string) {
    setValue("brand_id", nextBrandId, { shouldDirty: true, shouldValidate: true });
    const modelsForBrand = models.filter((m) => m.brand_id === nextBrandId);
    const currentModelId = getValues("model_id");
    const stillValid = modelsForBrand.some((m) => m.id === currentModelId);
    if (!stillValid) {
      setValue("model_id", "", { shouldDirty: true, shouldValidate: true });
    }
    setWarrantyManual(false);
  }

  const cancelHref = isEdit && deviceId ? `/devices/${deviceId}` : "/devices";

  async function onSubmit(values: DeviceFormValues) {
    if (serialCheck.status === "taken") {
      toast.error(
        serialCheck.message ?? "Bu seri numarası zaten kullanılıyor",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit) {
        if (!deviceId) {
          toast.error("Cihaz kimliği bulunamadı");
          return;
        }

        const result = await updateDevice({ id: deviceId, ...values });

        if (!result.success) {
          toast.error(result.error ?? "Cihaz güncellenemedi");
          return;
        }

        toast.success("Cihaz güncellendi");
        router.push(`/devices/${result.data.deviceId}`);
        router.refresh();
        return;
      }

      const result = await createDevice(values);

      if (!result.success) {
        toast.error(result.error ?? "Cihaz kaydedilemedi");
        return;
      }

      toast.success("Cihaz eklendi");
      router.push(`/devices/${result.data.deviceId}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
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
    router.push(cancelHref);
  }

  const serialUnavailable = serialCheck.status === "taken";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cihaz bilgileri</CardTitle>
          <CardDescription>
            {isEdit
              ? "Cihaz kaydını güncelleyin"
              : "Müşteri, marka ve model seçerek cihazı kaydedin"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel>Müşteri *</FieldLabel>
              <Controller
                control={control}
                name="customer_id"
                render={({ field }) => (
                  <div ref={customerPickerRef} className="relative">
                    <div className="relative">
                      <Input
                        className="h-10 pr-9"
                        placeholder="Müşteri ara veya seç…"
                        value={customerQuery}
                        onChange={(e) => {
                          setCustomerQuery(e.target.value);
                          setCustomerOpen(true);
                          if (!e.target.value.trim()) {
                            field.onChange("");
                          }
                        }}
                        onFocus={() => setCustomerOpen(true)}
                        autoComplete="off"
                      />
                      <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {customerOpen && filteredCustomers.length > 0 ? (
                      <ul
                        className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-md"
                        role="listbox"
                      >
                        {filteredCustomers.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              role="option"
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                                field.value === c.id && "bg-muted/60",
                              )}
                              onClick={() => {
                                field.onChange(c.id);
                                setCustomerQuery(c.name);
                                setCustomerOpen(false);
                              }}
                            >
                              {field.value === c.id ? (
                                <Check className="size-4 shrink-0 text-primary" />
                              ) : (
                                <span className="size-4 shrink-0" />
                              )}
                              {c.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {customerOpen &&
                    customerQuery.trim() &&
                    filteredCustomers.length === 0 ? (
                      <p className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-md">
                        Eşleşen müşteri bulunamadı
                      </p>
                    ) : null}
                  </div>
                )}
              />
              <FieldError errors={[errors.customer_id]} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="brand_id">Marka *</FieldLabel>
                <Controller
                  control={control}
                  name="brand_id"
                  render={({ field }) => (
                    <select
                      id="brand_id"
                      className={selectClassName}
                      value={field.value}
                      onChange={(e) => handleBrandChange(e.target.value)}
                    >
                      <option value="">Marka seçin</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <FieldError errors={[errors.brand_id]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="model_id">Model *</FieldLabel>
                <Controller
                  control={control}
                  name="model_id"
                  render={({ field }) => (
                    <select
                      id="model_id"
                      className={selectClassName}
                      value={field.value}
                      disabled={!brandId}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">
                        {brandId ? "Model seçin" : "Önce marka seçin"}
                      </option>
                      {brandModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <FieldError errors={[errors.model_id]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="serial_number">Seri No *</FieldLabel>
              <Input
                id="serial_number"
                className="h-10 font-mono"
                {...register("serial_number")}
              />
              {serialCheck.status === "checking" ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Seri numarası kontrol ediliyor…
                </p>
              ) : null}
              {serialCheck.status === "available" &&
              (serialNumber ?? "").trim() ? (
                <p className="mt-1 text-xs text-emerald-600">
                  Seri numarası kullanılabilir
                </p>
              ) : null}
              {serialCheck.status === "taken" ? (
                <p className="mt-1 text-xs text-destructive">
                  {serialCheck.message}
                </p>
              ) : null}
              <FieldError errors={[errors.serial_number]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kurulum ve garanti</CardTitle>
          <CardDescription>
            Kurulum tarihine göre garanti bitişi otomatik hesaplanır; gerekirse
            değiştirebilirsiniz
            {selectedBrand?.default_warranty_years != null
              ? ` (${selectedBrand.name}: ${selectedBrand.default_warranty_years} yıl)`
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="installation_date">Kurulum tarihi</FieldLabel>
              <Input
                id="installation_date"
                type="date"
                className="h-10"
                value={installationDate ?? ""}
                onChange={(e) => {
                  const v = e.target.value || null;
                  setValue("installation_date", v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setWarrantyManual(false);
                }}
              />
              <FieldError errors={[errors.installation_date]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="warranty_end_date">Garanti bitiş</FieldLabel>
              <Controller
                control={control}
                name="warranty_end_date"
                render={({ field }) => (
                  <Input
                    id="warranty_end_date"
                    type="date"
                    className="h-10"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value || null);
                      setWarrantyManual(true);
                    }}
                  />
                )}
              />
              <FieldError errors={[errors.warranty_end_date]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konum ve durum</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="location_address">
                Konum / departman
              </FieldLabel>
              <Input
                id="location_address"
                className="h-10"
                placeholder="Örn. Üretim hattı, depo B2"
                {...register("location_address")}
              />
              <FieldError errors={[errors.location_address]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Durum *</FieldLabel>
              <select
                id="status"
                className={selectClassName}
                {...register("status")}
              >
                {DEVICE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {DEVICE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <FieldError errors={[errors.status]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notlar</FieldLabel>
              <textarea
                id="notes"
                className={textareaClassName}
                rows={4}
                {...register("notes")}
              />
              <FieldError errors={[errors.notes]} />
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
          loadingText={isEdit ? "Güncelleniyor…" : "Kaydediliyor…"}
          className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
          disabled={serialUnavailable || serialCheck.status === "checking"}
        >
          {isEdit ? "Güncelle" : "Cihaz Ekle"}
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
