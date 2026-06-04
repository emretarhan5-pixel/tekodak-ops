"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { contractDetailToFormValues } from "@/lib/api/contracts/contract-detail-to-form-values";
import { createContract } from "@/lib/api/contracts/create-contract";
import { getContractCustomerDevices } from "@/lib/api/contracts/get-contract-customer-devices";
import type { ContractFormCustomerOption } from "@/lib/api/contracts/get-contract-form-options";
import type {
  ContractDetail,
  ContractDeviceItem,
} from "@/lib/api/contracts/types";
import { updateContract } from "@/lib/api/contracts/update-contract";
import {
  CONTRACT_CURRENCIES,
  CONTRACT_CURRENCY_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPES,
  type ContractCurrency,
  type ContractType,
} from "@/lib/constants/contract";
import { cn } from "@/lib/utils";
import {
  createContractSchema,
  type ContractEditFormValues,
  type ContractFormValues,
} from "@/schemas/contract";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[100px] resize-y py-2.5",
);

type ContractFormProps = {
  mode: "create" | "edit";
  initialData?: ContractDetail | null;
  customers: ContractFormCustomerOption[];
  responsibleUserId: string;
  prefillCustomerId?: string | null;
};

function emptyFormValues(responsibleUserId: string): ContractFormValues {
  return {
    customer_id: "",
    contract_type: "annual_maintenance",
    start_date: "",
    end_date: "",
    currency: "TRY",
    agreed_price: 0,
    list_price: null,
    minimum_price: null,
    override_reason: null,
    payment_method: "annual_prepaid",
    annual_maintenance_count: 0,
    sla_response_hours: 48,
    parts_included: true,
    travel_included: true,
    working_hours: "business",
    vat_included: true,
    vat_rate: 20,
    responsible_user_id: responsibleUserId,
    special_terms: null,
    notes: null,
    device_ids: [],
    status: "draft",
    renewed_from_id: null,
  };
}

export function ContractForm({
  mode,
  initialData = null,
  customers,
  responsibleUserId,
  prefillCustomerId = null,
}: ContractFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const contractId = isEdit && initialData ? initialData.id : undefined;
  const preservedStatus = isEdit && initialData ? initialData.status : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "active" | null>(
    null,
  );
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState(() => {
    if (isEdit && initialData) {
      return initialData.customer_name;
    }
    if (prefillCustomerId) {
      return customers.find((c) => c.id === prefillCustomerId)?.name ?? "";
    }
    return "";
  });
  const customerPickerRef = useRef<HTMLDivElement>(null);
  const [customerDevices, setCustomerDevices] = useState<ContractDeviceItem[]>(
    [],
  );
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesLoadError, setDevicesLoadError] = useState<string | null>(null);

  const resolvedDefaults = useMemo((): ContractFormValues => {
    if (isEdit && initialData) {
      const mapped = contractDetailToFormValues(initialData);
      const { id: _id, status: _status, ...rest } = mapped;
      return { ...emptyFormValues(responsibleUserId), ...rest };
    }
    const base = emptyFormValues(responsibleUserId);
    if (
      prefillCustomerId &&
      customers.some((c) => c.id === prefillCustomerId)
    ) {
      return { ...base, customer_id: prefillCustomerId };
    }
    return base;
  }, [isEdit, initialData, responsibleUserId, prefillCustomerId, customers]);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(createContractSchema),
    defaultValues: resolvedDefaults,
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = form;

  const customerId = useWatch({ control, name: "customer_id" });
  const deviceIds = useWatch({ control, name: "device_ids" }) ?? [];

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLocaleLowerCase("tr");
    if (!q) {
      return customers;
    }
    return customers.filter((c) =>
      c.name.toLocaleLowerCase("tr").includes(q),
    );
  }, [customers, customerQuery]);

  const selectedCustomerName = useMemo(
    () => customers.find((c) => c.id === customerId)?.name ?? "",
    [customers, customerId],
  );

  useEffect(() => {
    if (customerId && !customerQuery) {
      setCustomerQuery(selectedCustomerName);
    }
  }, [customerId, selectedCustomerName, customerQuery]);

  useEffect(() => {
    const trimmedId = (customerId ?? "").trim();
    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        trimmedId,
      );

    if (!isValidUuid) {
      setCustomerDevices([]);
      setDevicesLoadError(null);
      setDevicesLoading(false);
      return;
    }

    let cancelled = false;
    setDevicesLoading(true);
    setDevicesLoadError(null);

    void getContractCustomerDevices(trimmedId)
      .then((items) => {
        if (!cancelled) {
          setCustomerDevices(items);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCustomerDevices([]);
          setDevicesLoadError(
            error instanceof Error
              ? error.message
              : "Cihazlar yüklenirken bir hata oluştu",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDevicesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    if (devicesLoading || customerDevices.length === 0) {
      return;
    }
    const ids = getValues("device_ids") ?? [];
    const valid = ids.filter((id) =>
      customerDevices.some((d) => d.id === id),
    );
    if (valid.length !== ids.length) {
      setValue("device_ids", valid, { shouldDirty: true });
    }
  }, [customerId, customerDevices, devicesLoading, getValues, setValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customerPickerRef.current &&
        !customerPickerRef.current.contains(event.target as Node)
      ) {
        setCustomerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleDevice(deviceId: string, checked: boolean) {
    const current = getValues("device_ids") ?? [];
    const next = checked
      ? [...new Set([...current, deviceId])]
      : current.filter((id) => id !== deviceId);
    setValue("device_ids", next, { shouldDirty: true, shouldValidate: true });
  }

  const cancelHref = isEdit && contractId ? `/contracts/${contractId}` : "/contracts";

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

  async function onSubmitCreate(
    values: ContractFormValues,
    status: "draft" | "active",
  ) {
    setIsSubmitting(true);

    try {
      const result = await createContract({ ...values, status });

      if (!result.success) {
        toast.error(result.error ?? "Sözleşme kaydedilemedi");
        return;
      }

      const isDraft = status === "draft";
      toast.success(
        isDraft
          ? "Sözleşme taslak olarak kaydedildi"
          : "Sözleşme kaydedildi ve aktifleştirildi",
      );
      router.push(`/contracts/${result.data.contractId}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
      setSubmitIntent(null);
    }
  }

  async function onSubmitEdit(values: ContractFormValues) {
    if (!contractId || !preservedStatus) {
      toast.error("Sözleşme kimliği bulunamadı");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ContractEditFormValues = {
        ...values,
        id: contractId,
        status: preservedStatus,
      };

      const result = await updateContract(payload);

      if (!result.success) {
        toast.error(result.error ?? "Sözleşme güncellenemedi");
        return;
      }

      toast.success("Sözleşme güncellendi");
      router.push(`/contracts/${result.data.contractId}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitWithStatus(status: "draft" | "active") {
    setSubmitIntent(status);
    void handleSubmit((values) => onSubmitCreate(values, status))();
  }

  const loadingLabel =
    submitIntent === "active"
      ? "Aktifleştiriliyor…"
      : submitIntent === "draft"
        ? "Taslak kaydediliyor…"
        : isEdit
          ? "Güncelleniyor…"
          : "Kaydediliyor…";

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Sözleşme bilgileri</CardTitle>
          <CardDescription>
            {isEdit
              ? "Sözleşme numarası değiştirilemez"
              : "Müşteri ve tarih aralığını belirleyin; sözleşme numarası kayıt sırasında otomatik atanır"}
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
                        onBlur={() => {
                          setTimeout(() => setCustomerOpen(false), 150);
                          const q = customerQuery.trim();
                          if (!q) {
                            field.onChange("");
                            return;
                          }
                          const exact = customers.find(
                            (c) =>
                              c.name.toLocaleLowerCase("tr") ===
                              q.toLocaleLowerCase("tr"),
                          );
                          if (exact) {
                            field.onChange(exact.id);
                            setCustomerQuery(exact.name);
                          }
                        }}
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
                              onMouseDown={(e) => e.preventDefault()}
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

            <Field>
              <FieldLabel htmlFor="contract_number_display">
                Sözleşme No
              </FieldLabel>
              <Input
                id="contract_number_display"
                className="h-10 bg-muted/40 font-mono text-muted-foreground"
                value={
                  isEdit && initialData
                    ? initialData.contract_number
                    : "Otomatik atanacak"
                }
                readOnly
                disabled
                tabIndex={-1}
              />
              {!isEdit ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Kayıt sonrası SZ-2026-XXX formatında atanır
                </p>
              ) : null}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="start_date">Başlangıç tarihi *</FieldLabel>
                <Input
                  id="start_date"
                  type="date"
                  className="h-10"
                  {...register("start_date")}
                />
                <FieldError errors={[errors.start_date]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="end_date">Bitiş tarihi *</FieldLabel>
                <Input
                  id="end_date"
                  type="date"
                  className="h-10"
                  {...register("end_date")}
                />
                <FieldError errors={[errors.end_date]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="contract_type">Sözleşme tipi *</FieldLabel>
              <select
                id="contract_type"
                className={selectClassName}
                {...register("contract_type")}
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CONTRACT_TYPE_LABELS[t as ContractType]}
                  </option>
                ))}
              </select>
              <FieldError errors={[errors.contract_type]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tutar ve kapsam</CardTitle>
          <CardDescription>
            Anlaşılan tutar ve sözleşme kapsamındaki cihazlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="agreed_price">Tutar *</FieldLabel>
                <Input
                  id="agreed_price"
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-10"
                  {...register("agreed_price")}
                />
                <FieldError errors={[errors.agreed_price]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="currency">Para birimi *</FieldLabel>
                <select
                  id="currency"
                  className={selectClassName}
                  {...register("currency")}
                >
                  {CONTRACT_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {CONTRACT_CURRENCY_LABELS[c as ContractCurrency]}
                    </option>
                  ))}
                </select>
                <FieldError errors={[errors.currency]} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Kapsanan cihazlar</FieldLabel>
              {!customerId ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  Cihaz listesi için önce müşteri seçin
                </p>
              ) : devicesLoading ? (
                <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cihazlar yükleniyor…
                </p>
              ) : devicesLoadError ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-4 text-sm text-destructive">
                  {devicesLoadError}
                </p>
              ) : customerDevices.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  Bu müşteriye kayıtlı cihaz bulunamadı
                </p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {customerDevices.map((device) => {
                    const checked = deviceIds.includes(device.id);
                    return (
                      <label
                        key={device.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50",
                          checked && "bg-muted/40",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleDevice(device.id, value === true)
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm leading-snug">
                          <span className="font-mono font-medium">
                            {device.serial_number}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            — {device.brand_name} {device.model_name}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <FieldError errors={[errors.device_ids]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ek bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="special_terms">Ödeme koşulları</FieldLabel>
              <textarea
                id="special_terms"
                className={textareaClassName}
                rows={3}
                placeholder="Örn. Yıllık peşin, fatura 30 gün vadeli…"
                {...register("special_terms")}
              />
              <FieldError errors={[errors.special_terms]} />
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
        {isEdit ? (
          <SubmitButton
            type="button"
            isLoading={isSubmitting}
            loadingText={loadingLabel}
            className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
            onClick={() => void handleSubmit(onSubmitEdit)()}
          >
            Güncelle
          </SubmitButton>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              className="h-11 min-h-11 w-full gap-2 sm:w-auto sm:px-6"
              disabled={isSubmitting}
              onClick={() => submitWithStatus("draft")}
            >
              {isSubmitting && submitIntent === "draft" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                "Taslak Kaydet"
              )}
            </Button>
            <Button
              type="button"
              className="h-11 min-h-11 w-full gap-2 sm:w-auto sm:px-6"
              disabled={isSubmitting}
              onClick={() => submitWithStatus("active")}
            >
              {isSubmitting && submitIntent === "active" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                "Kaydet ve Aktifleştir"
              )}
            </Button>
          </>
        )}
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
