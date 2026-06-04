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
import { createWorkOrder } from "@/lib/api/work-orders/create-work-order";
import { getWorkOrderCustomerContracts } from "@/lib/api/work-orders/get-work-order-customer-contracts";
import { getWorkOrderCustomerDevices } from "@/lib/api/work-orders/get-work-order-customer-devices";
import { updateWorkOrder } from "@/lib/api/work-orders/update-work-order";
import { workOrderDetailToFormValues } from "@/lib/api/work-orders/work-order-to-form-values";
import type { WorkOrderDetail } from "@/lib/api/work-orders/types";
import type { WorkOrderFormAssigneeOption } from "@/lib/api/work-orders/get-work-order-form-options";
import type { WorkOrderFormCustomerOption } from "@/lib/api/work-orders/get-work-order-form-options";
import type { WorkOrderFormContractOption } from "@/lib/api/work-orders/get-work-order-customer-contracts";
import type { WorkOrderFormDeviceOption } from "@/lib/api/work-orders/get-work-order-customer-devices";
import {
  WORK_ORDER_FORM_WORK_TYPES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_PRIORITY_LABELS,
  type WorkOrderPriority,
} from "@/lib/constants/work-order";
import { cn } from "@/lib/utils";
import {
  workOrderFormSchema,
  type WorkOrderFormValues,
} from "@/schemas/work-order";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[120px] resize-y py-2.5",
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WorkOrderFormBaseProps = {
  customers: WorkOrderFormCustomerOption[];
  assignees: WorkOrderFormAssigneeOption[];
  initialCustomerDevices?: WorkOrderFormDeviceOption[];
  initialCustomerContracts?: WorkOrderFormContractOption[];
};

type WorkOrderFormCreateProps = WorkOrderFormBaseProps & {
  mode: "create";
  initialData?: null;
  prefillCustomerId?: string | null;
};

type WorkOrderFormEditProps = WorkOrderFormBaseProps & {
  mode: "edit";
  initialData: WorkOrderDetail;
};

type WorkOrderFormProps = WorkOrderFormCreateProps | WorkOrderFormEditProps;

function emptyFormValues(): WorkOrderFormValues {
  return {
    customer_id: "",
    device_id: null,
    contract_id: null,
    work_type: "periodic_maintenance",
    priority: "normal",
    assigned_user_ids: [],
    problem_description: "",
    scheduled_date: null,
    scheduled_time: null,
    service_location: null,
    service_location_note: null,
    internal_notes: null,
  };
}

export function WorkOrderForm(props: WorkOrderFormProps) {
  const {
    mode,
    customers,
    assignees,
    initialCustomerDevices = [],
    initialCustomerContracts = [],
  } = props;

  const isEdit = mode === "edit";
  const initialData = isEdit ? props.initialData : null;
  const prefillCustomerId =
    !isEdit && "prefillCustomerId" in props
      ? (props.prefillCustomerId ?? null)
      : null;
  const workOrderId = mode === "edit" ? props.initialData.id : undefined;
  const editStatus = mode === "edit" ? props.initialData.status : null;

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const [customerDevices, setCustomerDevices] = useState<WorkOrderFormDeviceOption[]>(
    initialCustomerDevices,
  );
  const [customerContracts, setCustomerContracts] = useState<
    WorkOrderFormContractOption[]
  >(initialCustomerContracts);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [devicesLoadError, setDevicesLoadError] = useState<string | null>(null);
  const [contractsLoadError, setContractsLoadError] = useState<string | null>(
    null,
  );

  const resolvedDefaults = useMemo((): WorkOrderFormValues => {
    if (isEdit && initialData) {
      return workOrderDetailToFormValues(initialData);
    }
    const base = emptyFormValues();
    if (
      prefillCustomerId &&
      customers.some((c) => c.id === prefillCustomerId)
    ) {
      return { ...base, customer_id: prefillCustomerId };
    }
    return base;
  }, [isEdit, initialData, prefillCustomerId, customers]);

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderFormSchema),
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
    } else if (prefillCustomerId) {
      const name =
        customers.find((c) => c.id === prefillCustomerId)?.name ?? "";
      if (name) {
        setCustomerQuery(name);
      }
    }
  }, [reset, resolvedDefaults, isEdit, initialData, prefillCustomerId, customers]);

  const customerId = useWatch({ control, name: "customer_id" });
  const deviceId = useWatch({ control, name: "device_id" });
  const contractId = useWatch({ control, name: "contract_id" });
  const assignedUserIds = useWatch({ control, name: "assigned_user_ids" }) ?? [];

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
    if (!UUID_RE.test(trimmedId)) {
      setCustomerDevices([]);
      setCustomerContracts([]);
      setDevicesLoadError(null);
      setContractsLoadError(null);
      setDevicesLoading(false);
      setContractsLoading(false);
      return;
    }

    let cancelled = false;
    setDevicesLoading(true);
    setContractsLoading(true);
    setDevicesLoadError(null);
    setContractsLoadError(null);

    void Promise.all([
      getWorkOrderCustomerDevices(trimmedId),
      getWorkOrderCustomerContracts(trimmedId),
    ])
      .then(([devices, contracts]) => {
        if (!cancelled) {
          setCustomerDevices(devices);
          setCustomerContracts(contracts);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCustomerDevices([]);
          setCustomerContracts([]);
          const msg =
            error instanceof Error
              ? error.message
              : "Müşteri verileri yüklenirken bir hata oluştu";
          setDevicesLoadError(msg);
          setContractsLoadError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDevicesLoading(false);
          setContractsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    if (devicesLoading || contractsLoading) {
      return;
    }
    const currentDevice = getValues("device_id");
    if (
      currentDevice &&
      !customerDevices.some((d) => d.id === currentDevice)
    ) {
      setValue("device_id", null, { shouldDirty: true });
    }
    const currentContract = getValues("contract_id");
    if (
      currentContract &&
      !customerContracts.some((c) => c.id === currentContract)
    ) {
      setValue("contract_id", null, { shouldDirty: true });
    }
  }, [
    customerId,
    customerDevices,
    customerContracts,
    devicesLoading,
    contractsLoading,
    getValues,
    setValue,
  ]);

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

  function toggleAssignee(userId: string, checked: boolean) {
    const current = getValues("assigned_user_ids") ?? [];
    const next = checked
      ? [...new Set([...current, userId])]
      : current.filter((id) => id !== userId);
    setValue("assigned_user_ids", next, { shouldDirty: true });
  }

  function clearDeviceAndContractIfCustomerChanged(nextCustomerId: string) {
    const previous = getValues("customer_id");
    if (previous && previous !== nextCustomerId) {
      setValue("device_id", null, { shouldDirty: true });
      setValue("contract_id", null, { shouldDirty: true });
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
    router.push(isEdit && workOrderId ? `/work-orders/${workOrderId}` : "/work-orders");
  }

  async function onSubmit(values: WorkOrderFormValues) {
    setIsSubmitting(true);

    try {
      const { assigned_user_ids, ...core } = values;
      const primaryAssignee = assigned_user_ids[0] ?? null;

      if (isEdit && workOrderId && editStatus) {
        const result = await updateWorkOrder({
          id: workOrderId,
          status: editStatus,
          ...core,
          assigned_to: primaryAssignee,
        });

        if (!result.success) {
          toast.error(result.error ?? "İş emri güncellenemedi");
          return;
        }

        if (assigned_user_ids.length > 1) {
          toast.message(
            "Birden fazla personel seçildi; birincil atanan kaydedildi",
            {
              description:
                "Çoklu atama ileride genişletilecek. Şimdilik ilk seçilen personel atanır.",
            },
          );
        }

        toast.success("İş emri güncellendi");
        router.push(`/work-orders/${workOrderId}`);
        router.refresh();
        return;
      }

      const result = await createWorkOrder({
        ...core,
        assigned_to: primaryAssignee,
      });

      if (!result.success) {
        toast.error(result.error ?? "İş emri kaydedilemedi");
        return;
      }

      if (assigned_user_ids.length > 1) {
        toast.message(
          "Birden fazla personel seçildi; birincil atanan kaydedildi",
          {
            description:
              "Çoklu atama ileride genişletilecek. Şimdilik ilk seçilen personel atanır.",
          },
        );
      }

      toast.success("İş emri oluşturuldu");
      router.push(`/work-orders/${result.data.workOrderId}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>İş emri bilgileri</CardTitle>
          <CardDescription>
            {isEdit
              ? "Müşteri, cihaz, sözleşme ve iş tanımını güncelleyin"
              : "Müşteri ve iş tanımını girin; iş emri numarası kayıt sırasında otomatik atanır (İE-2026-XXX)"}
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
                            if (field.value) {
                              field.onChange("");
                              setValue("device_id", null);
                              setValue("contract_id", null);
                            }
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
                            clearDeviceAndContractIfCustomerChanged(exact.id);
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
                                clearDeviceAndContractIfCustomerChanged(c.id);
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
              <FieldLabel htmlFor="work_order_number_display">
                İş Emri No
              </FieldLabel>
              <Input
                id="work_order_number_display"
                className="h-10 bg-muted/40 font-mono text-muted-foreground"
                value={
                  isEdit && initialData
                    ? initialData.work_order_number
                    : "Otomatik atanacak"
                }
                readOnly
                disabled
                tabIndex={-1}
              />
              {!isEdit ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Kayıt sonrası İE-2026-XXX formatında atanır
                </p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="device_id">Cihaz</FieldLabel>
              <select
                id="device_id"
                className={selectClassName}
                disabled={!customerId || devicesLoading}
                value={deviceId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue("device_id", v || null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <option value="">Cihaz seçilmedi (opsiyonel)</option>
                {customerDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.serial_number} · {d.brand_name} {d.model_name}
                  </option>
                ))}
              </select>
              {!customerId ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Önce müşteri seçin
                </p>
              ) : devicesLoading ? (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Cihazlar yükleniyor…
                </p>
              ) : devicesLoadError ? (
                <p className="mt-1 text-xs text-destructive">
                  {devicesLoadError}
                </p>
              ) : customerDevices.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Bu müşteriye kayıtlı cihaz yok — cihazsız iş emri
                  oluşturabilirsiniz
                </p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="contract_id">Sözleşme</FieldLabel>
              <select
                id="contract_id"
                className={selectClassName}
                disabled={!customerId || contractsLoading}
                value={contractId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue("contract_id", v || null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <option value="">Sözleşme bağlanmadı (opsiyonel)</option>
                {customerContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              {!customerId ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Önce müşteri seçin
                </p>
              ) : contractsLoading ? (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Sözleşmeler yükleniyor…
                </p>
              ) : contractsLoadError ? (
                <p className="mt-1 text-xs text-destructive">
                  {contractsLoadError}
                </p>
              ) : customerContracts.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Bu müşteriye bağlı sözleşme yok
                </p>
              ) : null}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="work_type">İş tipi *</FieldLabel>
                <select
                  id="work_type"
                  className={selectClassName}
                  {...register("work_type")}
                >
                  {WORK_ORDER_FORM_WORK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={[errors.work_type]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="priority">Öncelik *</FieldLabel>
                <select
                  id="priority"
                  className={selectClassName}
                  {...register("priority")}
                >
                  {WORK_ORDER_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {WORK_ORDER_PRIORITY_LABELS[p as WorkOrderPriority]}
                    </option>
                  ))}
                </select>
                <FieldError errors={[errors.priority]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="scheduled_date">Planlanan tarih</FieldLabel>
              <Input
                id="scheduled_date"
                type="date"
                className="h-10"
                {...register("scheduled_date")}
              />
              <FieldError errors={[errors.scheduled_date]} />
            </Field>

            <Field>
              <FieldLabel>Yapılacak iş / açıklama *</FieldLabel>
              <textarea
                id="problem_description"
                className={textareaClassName}
                placeholder="Müşteri talebi, arıza tanımı veya yapılacak işlemler…"
                {...register("problem_description")}
              />
              <FieldError errors={[errors.problem_description]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atanan personel</CardTitle>
          <CardDescription>
            Birden fazla seçilebilir; kayıtta birincil atanan personel atanır
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            {assignees.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Atanabilir personel bulunamadı
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {assignees.map((user) => {
                  const checked = assignedUserIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50",
                        checked && "bg-muted/40",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleAssignee(user.id, value === true)
                        }
                      />
                      <span className="text-sm">{user.full_name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleCancel}
        >
          İptal
        </Button>
        <SubmitButton
          isLoading={isSubmitting}
          loadingText={isEdit ? "Güncelleniyor…" : "Kaydediliyor…"}
          className="w-full sm:w-auto"
        >
          {isEdit ? "Güncelle" : "İş emrini oluştur"}
        </SubmitButton>
      </div>
    </form>
  );
}
