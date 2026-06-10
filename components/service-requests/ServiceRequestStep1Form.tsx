"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Search, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { checkTaxNumber } from "@/lib/api/service-requests/check-tax-number";
import { createServiceRequest } from "@/lib/api/service-requests/create-service-request";
import { getServiceRequestCustomerDevices } from "@/lib/api/service-requests/get-service-request-customer-devices";
import { getServiceRequestCustomerSnapshot } from "@/lib/api/service-requests/get-service-request-customer-snapshot";
import type {
  CheckTaxNumberCustomer,
  ServiceRequestFormBranchOption,
  ServiceRequestFormCustomerOption,
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
  customers: ServiceRequestFormCustomerOption[];
  deviceModels: ServiceRequestFormDeviceModelOption[];
  technicianName: string;
  isAdmin: boolean;
  defaultBranchId?: string | null;
};

function emptyValues(defaultBranchId?: string | null): ServiceRequestStep1FormValues {
  return {
    branch_id: defaultBranchId ?? "",
    customer_mode: "registered",
    customer_id: null,
    tax_number: "",
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
  customers,
  deviceModels,
  technicianName,
  isAdmin,
  defaultBranchId,
}: ServiceRequestStep1FormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [customerModeChosen, setCustomerModeChosen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");

  const [customerModelIds, setCustomerModelIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [checkingTaxNumber, setCheckingTaxNumber] = useState(false);
  const [duplicateMatch, setDuplicateMatch] =
    useState<CheckTaxNumberCustomer | null>(null);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<ServiceRequestStep1FormValues>({
    resolver: zodResolver(serviceRequestStep1FormSchema),
    defaultValues: emptyValues(defaultBranchId),
  });

  const customerMode = watch("customer_mode");
  const customerId = watch("customer_id");
  const brandModelMode = watch("brand_model_mode");
  const selectedBranchId = watch("branch_id");
  const isRegisteredCustomer = customerMode === "registered";
  const hasSelectedCustomer = Boolean(customerId);
  const customerFieldsReadOnly = isRegisteredCustomer && hasSelectedCustomer;

  const scopedCustomers = useMemo(() => {
    if (!isAdmin || !selectedBranchId) {
      return customers;
    }
    return customers.filter((customer) => customer.branch_id === selectedBranchId);
  }, [customers, isAdmin, selectedBranchId]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLocaleLowerCase("tr-TR");
    if (!query) {
      return scopedCustomers.slice(0, 50);
    }
    return scopedCustomers
      .filter((customer) =>
        customer.name.toLocaleLowerCase("tr-TR").includes(query),
      )
      .slice(0, 50);
  }, [customerQuery, scopedCustomers]);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLocaleLowerCase("tr-TR");
    const source = query
      ? deviceModels.filter((model) =>
          model.label.toLocaleLowerCase("tr-TR").includes(query),
        )
      : deviceModels;
    return source.slice(0, 80);
  }, [deviceModels, modelQuery]);

  const customerModels = useMemo(
    () => filteredModels.filter((model) => customerModelIds.has(model.id)),
    [filteredModels, customerModelIds],
  );

  const otherModels = useMemo(
    () => filteredModels.filter((model) => !customerModelIds.has(model.id)),
    [filteredModels, customerModelIds],
  );

  useEffect(() => {
    if (!customerId) {
      setCustomerModelIds(new Set());
      return;
    }

    let cancelled = false;

    getServiceRequestCustomerDevices(customerId)
      .then((devices) => {
        if (cancelled) return;
        setCustomerModelIds(
          new Set(devices.map((device) => device.model_id).filter(Boolean)),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCustomerModelIds(new Set());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function applyCustomerSnapshot(id: string) {
    try {
      const snapshot = await getServiceRequestCustomerSnapshot(id);
      setValue("customer_id", snapshot.customer_id);
      setValue("company_name", snapshot.company_name);
      setValue("contact_name", snapshot.contact_name);
      setValue("phone", snapshot.phone);
      setValue("address", snapshot.address);
      setCustomerQuery(snapshot.company_name);
      setDuplicateMatch(null);
      setDuplicateDismissed(false);
    } catch {
      toast.error("Müşteri bilgileri yüklenemedi");
    }
  }

  async function handleSelectCustomer(id: string, name: string) {
    setValue("customer_id", id);
    setCustomerQuery(name);
    setCustomerOpen(false);
    await applyCustomerSnapshot(id);
  }

  function clearRegisteredCustomer() {
    setValue("customer_id", null);
    setCustomerQuery("");
    resetField("company_name");
    resetField("contact_name");
    resetField("phone");
    resetField("address");
    setCustomerModelIds(new Set());
  }

  function switchCustomerMode(mode: "registered" | "new") {
    setCustomerModeChosen(true);
    setValue("customer_mode", mode);
    setValue("customer_id", null);
    setValue("tax_number", "");
    resetField("company_name");
    resetField("contact_name");
    resetField("phone");
    resetField("address");
    setCustomerQuery("");
    setDuplicateMatch(null);
    setDuplicateDismissed(false);
    setCustomerModelIds(new Set());
  }

  async function handleTaxNumberBlur() {
    if (customerMode !== "new") return;

    const taxNumber = watch("tax_number")?.trim() ?? "";
    if (!taxNumber) {
      setDuplicateMatch(null);
      return;
    }

    setCheckingTaxNumber(true);
    try {
      const branchId = selectedBranchId?.trim() || undefined;
      const result = await checkTaxNumber(taxNumber, branchId);
      if (!result.found) {
        if ("error" in result && result.error) {
          toast.error(result.error);
        }
        setDuplicateMatch(null);
        return;
      }
      setDuplicateMatch(result.customer);
      setDuplicateDismissed(false);
    } catch (error) {
      console.error("[handleTaxNumberBlur] checkTaxNumber istemci hatası:", error);
      toast.error("Vergi numarası kontrol edilemedi");
    } finally {
      setCheckingTaxNumber(false);
    }
  }

  async function handleUseDuplicateCustomer() {
    if (!duplicateMatch) return;
    setValue("customer_mode", "registered");
    await handleSelectCustomer(duplicateMatch.id, duplicateMatch.name);
  }

  function renderModelOption(
    model: ServiceRequestFormDeviceModelOption,
    selectedId: string | null,
    onSelect: (model: ServiceRequestFormDeviceModelOption) => void,
  ) {
    return (
      <li key={model.id}>
        <button
          type="button"
          role="option"
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
            selectedId === model.id && "bg-muted/60",
          )}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(model)}
        >
          {selectedId === model.id ? (
            <Check className="size-4 shrink-0 text-primary" />
          ) : (
            <span className="size-4 shrink-0" />
          )}
          {model.label}
        </button>
      </li>
    );
  }

  async function onSubmit(values: ServiceRequestStep1FormValues) {
    if (!customerModeChosen) {
      toast.error("Lütfen müşteri seçim yöntemini belirleyin");
      return;
    }

    if (isAdmin && !values.branch_id) {
      toast.error("Şube seçimi zorunludur");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createServiceRequest({
        branch_id: isAdmin ? values.branch_id || undefined : undefined,
        customer_id:
          values.customer_mode === "registered" ? values.customer_id : null,
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

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Müşteri bilgileri</CardTitle>
          <CardDescription>Müşteri sistemde kayıtlı mı?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 overflow-visible">
          {!customerModeChosen ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="h-12 min-h-11 w-full justify-center gap-2"
                disabled={isSubmitting}
                onClick={() => switchCustomerMode("registered")}
              >
                <Search className="size-4" />
                Kayıtlı Müşteri Seç
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 min-h-11 w-full justify-center gap-2"
                disabled={isSubmitting}
                onClick={() => switchCustomerMode("new")}
              >
                <UserPlus className="size-4" />
                Yeni Müşteri
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={isRegisteredCustomer ? "default" : "outline"}
                disabled={isSubmitting}
                onClick={() => switchCustomerMode("registered")}
              >
                Kayıtlı müşteri
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!isRegisteredCustomer ? "default" : "outline"}
                disabled={isSubmitting}
                onClick={() => switchCustomerMode("new")}
              >
                Yeni müşteri
              </Button>
            </div>
          )}

          {customerModeChosen && isRegisteredCustomer ? (
            <Field>
              <FieldLabel>Müşteri *</FieldLabel>
              <Controller
                control={control}
                name="customer_id"
                render={({ field }) => (
                  <Popover
                    open={customerOpen}
                    onOpenChange={(open, details) => {
                      if (!open && details.reason === "trigger-press") {
                        return;
                      }
                      setCustomerOpen(open);
                    }}
                    modal={false}
                  >
                    <PopoverTrigger
                      nativeButton={false}
                      render={<div className="relative w-full" />}
                    >
                      <Input
                        className="h-11 pr-20"
                        placeholder="Firma adı ile ara…"
                        value={customerQuery}
                        disabled={isSubmitting}
                        onChange={(event) => {
                          setCustomerQuery(event.target.value);
                          setCustomerOpen(true);
                          if (!event.target.value.trim()) {
                            field.onChange(null);
                            resetField("company_name");
                            resetField("contact_name");
                            resetField("phone");
                            resetField("address");
                          }
                        }}
                        onFocus={() => setCustomerOpen(true)}
                        autoComplete="off"
                      />
                      <div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                        {hasSelectedCustomer ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="pointer-events-auto"
                            aria-label="Müşteri seçimini temizle"
                            disabled={isSubmitting}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={clearRegisteredCustomer}
                          >
                            <X className="size-4" />
                          </Button>
                        ) : null}
                        <ChevronsUpDown className="size-4 text-muted-foreground" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      className="z-50 max-h-56 w-(--anchor-width) overflow-auto p-0"
                    >
                      {filteredCustomers.length > 0 ? (
                        <ul role="listbox">
                          {filteredCustomers.map((customer) => (
                            <li key={customer.id}>
                              <button
                                type="button"
                                role="option"
                                className={cn(
                                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                                  field.value === customer.id && "bg-muted/60",
                                )}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() =>
                                  void handleSelectCustomer(
                                    customer.id,
                                    customer.name,
                                  )
                                }
                              >
                                {field.value === customer.id ? (
                                  <Check className="size-4 shrink-0 text-primary" />
                                ) : (
                                  <span className="size-4 shrink-0" />
                                )}
                                {customer.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          {customerQuery.trim()
                            ? "Eşleşen müşteri bulunamadı"
                            : scopedCustomers.length === 0
                              ? "Bu şubede kayıtlı müşteri bulunamadı"
                              : "Müşteri bulunamadı"}
                        </p>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError errors={[errors.customer_id]} />
            </Field>
          ) : null}

          {customerModeChosen && !isRegisteredCustomer ? (
            <Field>
              <FieldLabel htmlFor="tax_number">Vergi No *</FieldLabel>
              <Input
                id="tax_number"
                className="h-11"
                inputMode="numeric"
                disabled={isSubmitting || checkingTaxNumber}
                {...register("tax_number")}
                onBlur={() => void handleTaxNumberBlur()}
              />
              <FieldError errors={[errors.tax_number]} />
              {duplicateMatch && !duplicateDismissed ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  <p className="font-medium">
                    Bu vergi numarası sistemde kayıtlı görünüyor
                  </p>
                  <p className="mt-1 text-amber-900/90">
                    📋 {duplicateMatch.name} — {duplicateMatch.phone} —{" "}
                    {duplicateMatch.city}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-10"
                      disabled={isSubmitting}
                      onClick={() => void handleUseDuplicateCustomer()}
                    >
                      Bu firmayı seç →
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-10"
                      disabled={isSubmitting}
                      onClick={() => setDuplicateDismissed(true)}
                    >
                      Yine de devam
                    </Button>
                  </div>
                </div>
              ) : null}
            </Field>
          ) : null}

          {customerModeChosen && !isRegisteredCustomer ? (
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="company_name">Firma / Kurum *</FieldLabel>
                <Input
                  id="company_name"
                  className="h-11"
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
                    className="h-11"
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
                    className="h-11"
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
          ) : null}

          {customerModeChosen && isRegisteredCustomer && hasSelectedCustomer ? (
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="company_name">Firma / Kurum *</FieldLabel>
                <Input
                  id="company_name"
                  className="h-11 bg-muted/40"
                  readOnly
                  disabled={isSubmitting}
                  {...register("company_name")}
                />
                <FieldError errors={[errors.company_name]} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="contact_name">Yetkili Ad Soyad *</FieldLabel>
                  <Input
                    id="contact_name"
                    className="h-11 bg-muted/40"
                    readOnly
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
                    className="h-11 bg-muted/40"
                    readOnly
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
                  className={cn(textareaClassName, "bg-muted/40")}
                  rows={3}
                  readOnly
                  disabled={isSubmitting}
                  {...register("address")}
                />
                <FieldError errors={[errors.address]} />
              </Field>
            </FieldGroup>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Cihaz bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="device_type">Cihaz türü *</FieldLabel>
              <Input
                id="device_type"
                className="h-11"
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
                    <Popover
                      open={modelOpen}
                      onOpenChange={(open, details) => {
                        if (!open && details.reason === "trigger-press") {
                          return;
                        }
                        setModelOpen(open);
                      }}
                      modal={false}
                    >
                      <PopoverTrigger
                        nativeButton={false}
                        render={<div className="relative w-full" />}
                      >
                        <Input
                          className="h-11 pr-9"
                          placeholder="Marka veya model ara…"
                          value={modelQuery}
                          disabled={isSubmitting}
                          onChange={(event) => {
                            setModelQuery(event.target.value);
                            setModelOpen(true);
                            if (!event.target.value.trim()) {
                              field.onChange(null);
                              setValue("brand_model", "");
                            }
                          }}
                          onFocus={() => setModelOpen(true)}
                          autoComplete="off"
                        />
                        <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="bottom"
                        sideOffset={4}
                        className="z-50 max-h-56 w-(--anchor-width) overflow-auto p-0"
                      >
                        {filteredModels.length > 0 ? (
                          <ul role="listbox">
                            {customerModels.length > 0 ? (
                              <>
                                <li className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Bu müşterinin cihazları
                                </li>
                                {customerModels.map((model) =>
                                  renderModelOption(model, field.value, (selected) => {
                                    field.onChange(selected.id);
                                    setValue("brand_model", selected.label);
                                    setModelQuery(selected.label);
                                    setModelOpen(false);
                                  }),
                                )}
                                {otherModels.length > 0 ? (
                                  <li className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Diğer
                                  </li>
                                ) : null}
                              </>
                            ) : null}
                            {(customerModels.length === 0
                              ? filteredModels
                              : otherModels
                            ).map((model) =>
                              renderModelOption(model, field.value, (selected) => {
                                field.onChange(selected.id);
                                setValue("brand_model", selected.label);
                                setModelQuery(selected.label);
                                setModelOpen(false);
                              }),
                            )}
                          </ul>
                        ) : (
                          <p className="px-3 py-2 text-sm text-muted-foreground">
                            {modelQuery.trim()
                              ? "Eşleşen model bulunamadı — manuel girişi deneyin"
                              : "Model bulunamadı"}
                          </p>
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                />
              ) : (
                <Input
                  className="h-11"
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
                className="h-11 font-mono"
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
                className="h-11 bg-muted/40"
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
