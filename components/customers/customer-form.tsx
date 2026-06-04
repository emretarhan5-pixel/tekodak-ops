"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { checkTaxNumberAvailable } from "@/lib/api/customers/check-tax-number-available";
import { createCustomer } from "@/lib/api/customers/create-customer";
import { customerDetailToFormValues } from "@/lib/api/customers/customer-to-form-values";
import type {
  BranchOption,
  SectorOption,
} from "@/lib/api/customers/get-customer-filter-options";
import type { StaffUserOption } from "@/lib/api/customers/get-customer-form-options";
import { updateCustomer } from "@/lib/api/customers/update-customer";
import type { CustomerDetail } from "@/lib/api/customers/types";
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPES,
  type CustomerType,
} from "@/lib/constants/customer";
import { isValidTaxNumber, normalizeTaxNumber } from "@/lib/utils/tax-number";
import { cn } from "@/lib/utils";
import {
  customerContactSchema,
  customerFormSchema,
  type CustomerFormValues,
} from "@/schemas/customer";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[100px] resize-y py-2.5",
);

const MAX_CONTACTS = 10;

type CustomerFormProps = {
  mode: "create" | "edit";
  initialData?: CustomerDetail | null;
  branches: BranchOption[];
  sectors: SectorOption[];
  users: StaffUserOption[];
  defaultBranchId?: string | null;
  lockBranch?: boolean;
};

function emptyContact(): CustomerFormValues["contacts"][number] {
  return {
    full_name: "",
    title: "",
    phone: "",
    email: "",
    is_primary: false,
    notes: "",
  };
}

function buildCustomerPayload(values: CustomerFormValues) {
  const contacts = values.contacts
    .filter((c) => c.full_name.trim())
    .map((c) =>
      customerContactSchema.parse({
        ...c,
        full_name: c.full_name.trim(),
        title: c.title || null,
        phone: c.phone?.trim() || null,
        email: c.email?.trim() || null,
        notes: c.notes || null,
      }),
    );

  const responsible_user_ids = [
    values.primary_responsible_user_id,
    ...values.responsible_user_ids.filter(
      (id) => id !== values.primary_responsible_user_id,
    ),
  ];

  const { primary_responsible_user_id: _primary, ...rest } = values;

  return {
    ...rest,
    tax_office: rest.tax_office || null,
    sector: rest.sector || null,
    email: rest.email || null,
    website: rest.website || null,
    district: rest.district || null,
    full_address: rest.full_address || null,
    notes: rest.notes || null,
    contacts,
    responsible_user_ids,
  };
}

function emptyFormValues(defaultBranch: string): CustomerFormValues {
  return {
    name: "",
    tax_office: "",
    tax_number: "",
    customer_type: "private" as CustomerType,
    sector: "",
    main_phone: "",
    email: "",
    website: "",
    city: "",
    district: "",
    full_address: "",
    notes: "",
    branch_id: defaultBranch,
    contacts: [],
    responsible_user_ids: [],
    primary_responsible_user_id: "",
  };
}

export function CustomerForm({
  mode,
  initialData = null,
  branches,
  sectors,
  users,
  defaultBranchId,
  lockBranch = false,
}: CustomerFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const customerId = initialData?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxCheck, setTaxCheck] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "invalid";
    message?: string;
  }>({ status: "idle" });

  const defaultBranch =
    lockBranch && defaultBranchId
      ? defaultBranchId
      : branches.length === 1
        ? branches[0]?.id
        : defaultBranchId ?? "";

  const resolvedDefaults = useMemo(() => {
    if (isEdit && initialData) {
      return customerDetailToFormValues(initialData);
    }
    return emptyFormValues(defaultBranch ?? "");
  }, [isEdit, initialData, defaultBranch]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  const taxNumber = useWatch({ control, name: "tax_number" });
  const branchId = useWatch({ control, name: "branch_id" });
  const responsibleIds = useWatch({ control, name: "responsible_user_ids" });
  const primaryResponsibleId = useWatch({
    control,
    name: "primary_responsible_user_id",
  });

  const branchUsers = useMemo(() => {
    if (!branchId) return [];
    return users.filter((u) => u.branch_id === branchId);
  }, [users, branchId]);

  useEffect(() => {
    const normalized = normalizeTaxNumber(taxNumber ?? "");

    if (!normalized) {
      setTaxCheck({ status: "idle" });
      return;
    }

    if (
      isEdit &&
      initialData &&
      normalized === normalizeTaxNumber(initialData.tax_number)
    ) {
      setTaxCheck({ status: "idle" });
      return;
    }

    if (!isValidTaxNumber(normalized)) {
      setTaxCheck({
        status: "invalid",
        message: "Vergi numarası 10 veya 11 haneli olmalıdır",
      });
      return;
    }

    setTaxCheck({ status: "checking" });

    const timer = window.setTimeout(async () => {
      const result = await checkTaxNumberAvailable(
        normalized,
        isEdit ? customerId : undefined,
      );
      if (result.available) {
        setTaxCheck({ status: "available" });
      } else {
        setTaxCheck({
          status: result.message?.includes("10 veya 11") ? "invalid" : "taken",
          message: result.message,
        });
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [taxNumber, isEdit, initialData, customerId]);

  useEffect(() => {
    if (!branchId) return;

    const currentIds = getValues("responsible_user_ids");
    const validIds = currentIds.filter((id) =>
      branchUsers.some((u) => u.id === id),
    );
    if (validIds.length !== currentIds.length) {
      setValue("responsible_user_ids", validIds, { shouldDirty: true });
    }

    const primary = getValues("primary_responsible_user_id");
    if (primary && !validIds.includes(primary)) {
      setValue("primary_responsible_user_id", validIds[0] ?? "", {
        shouldDirty: true,
      });
    }
  }, [branchId, branchUsers, getValues, setValue]);

  function toggleResponsible(userId: string, checked: boolean) {
    const current = getValues("responsible_user_ids");
    let next: string[];

    if (checked) {
      next = [...current, userId];
      if (next.length === 1) {
        setValue("primary_responsible_user_id", userId, { shouldDirty: true });
      }
    } else {
      next = current.filter((id) => id !== userId);
      if (getValues("primary_responsible_user_id") === userId) {
        setValue("primary_responsible_user_id", next[0] ?? "", {
          shouldDirty: true,
        });
      }
    }

    setValue("responsible_user_ids", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const cancelHref =
    isEdit && customerId ? `/customers/${customerId}` : "/customers";

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

  async function onSubmit(values: CustomerFormValues) {
    if (taxCheck.status === "taken" || taxCheck.status === "invalid") {
      toast.error(taxCheck.message ?? "Vergi numarası geçersiz");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildCustomerPayload(values);

      if (isEdit) {
        if (!customerId) {
          toast.error("Müşteri kimliği bulunamadı");
          return;
        }

        const result = await updateCustomer({ id: customerId, ...payload });

        if (!result.success) {
          toast.error(result.error ?? "Müşteri güncellenemedi");
          return;
        }

        toast.success("Müşteri güncellendi");
        router.push(`/customers/${customerId}`);
        router.refresh();
        return;
      }

      const result = await createCustomer(payload);

      if (!result.success) {
        toast.error(result.error ?? "Müşteri kaydedilemedi");
        return;
      }

      toast.success("Müşteri eklendi");
      router.push(`/customers/${result.data.customerId}`);
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  const taxUnavailable =
    taxCheck.status === "taken" || taxCheck.status === "invalid";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kurum bilgileri</CardTitle>
          <CardDescription>Temel kurumsal kimlik bilgileri</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Kurum adı *</FieldLabel>
              <Input
                id="name"
                className="h-10"
                placeholder="Örn. ABC Hastanesi"
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="tax_office">Vergi dairesi</FieldLabel>
                <Input
                  id="tax_office"
                  className="h-10"
                  {...register("tax_office")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="tax_number">Vergi no *</FieldLabel>
                <div className="relative">
                  <Input
                    id="tax_number"
                    className="h-10 pr-10"
                    inputMode="numeric"
                    placeholder="10 veya 11 hane"
                    {...register("tax_number")}
                  />
                  {taxCheck.status === "checking" ? (
                    <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                <FieldError errors={[errors.tax_number]} />
                {taxCheck.message ? (
                  <p
                    className={cn(
                      "text-sm",
                      taxUnavailable
                        ? "text-destructive"
                        : taxCheck.status === "available"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {taxCheck.message}
                  </p>
                ) : taxCheck.status === "available" ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Vergi numarası kullanılabilir
                  </p>
                ) : null}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="customer_type">Müşteri tipi *</FieldLabel>
                <select
                  id="customer_type"
                  className={selectClassName}
                  {...register("customer_type")}
                >
                  {CUSTOMER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CUSTOMER_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <FieldError errors={[errors.customer_type]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="sector">Sektör</FieldLabel>
                <select
                  id="sector"
                  className={selectClassName}
                  {...register("sector")}
                >
                  <option value="">Seçiniz</option>
                  {sectors.map((sector) => (
                    <option key={sector.code} value={sector.code}>
                      {sector.display_name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="main_phone">Ana telefon *</FieldLabel>
              <Input
                id="main_phone"
                className="h-10"
                type="tel"
                placeholder="05xx xxx xx xx"
                {...register("main_phone")}
              />
              <FieldError errors={[errors.main_phone]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">E-posta</FieldLabel>
                <Input
                  id="email"
                  className="h-10"
                  type="email"
                  placeholder="ornek@kurum.com"
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="website">Web sitesi</FieldLabel>
                <Input
                  id="website"
                  className="h-10"
                  type="url"
                  placeholder="https://"
                  {...register("website")}
                />
                <FieldError errors={[errors.website]} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adres</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="city">İl *</FieldLabel>
                <Input id="city" className="h-10" {...register("city")} />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="district">İlçe</FieldLabel>
                <Input
                  id="district"
                  className="h-10"
                  {...register("district")}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="full_address">Adres</FieldLabel>
              <textarea
                id="full_address"
                className={textareaClassName}
                rows={3}
                {...register("full_address")}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>İlgili kişiler</CardTitle>
            <CardDescription>Müşteri tarafındaki iletişim kişileri</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 shrink-0 gap-1"
            disabled={fields.length >= MAX_CONTACTS}
            onClick={() => append(emptyContact())}
          >
            <Plus className="size-4" />
            Kişi Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              İsteğe bağlı. En fazla {MAX_CONTACTS} kişi ekleyebilirsiniz.
            </p>
          ) : null}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Kişi {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                  Kaldır
                </Button>
              </div>

              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Ad</FieldLabel>
                    <Input
                      className="h-10"
                      {...register(`contacts.${index}.full_name`)}
                    />
                    <FieldError
                      errors={[errors.contacts?.[index]?.full_name]}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Unvan</FieldLabel>
                    <Input
                      className="h-10"
                      {...register(`contacts.${index}.title`)}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Telefon</FieldLabel>
                    <Input
                      className="h-10"
                      type="tel"
                      {...register(`contacts.${index}.phone`)}
                    />
                    <FieldError errors={[errors.contacts?.[index]?.phone]} />
                  </Field>
                  <Field>
                    <FieldLabel>E-posta</FieldLabel>
                    <Input
                      className="h-10"
                      type="email"
                      {...register(`contacts.${index}.email`)}
                    />
                    <FieldError errors={[errors.contacts?.[index]?.email]} />
                  </Field>
                </div>

                <Field orientation="horizontal">
                  <Controller
                    control={control}
                    name={`contacts.${index}.is_primary`}
                    render={({ field: checkboxField }) => (
                      <Checkbox
                        checked={checkboxField.value}
                        onCheckedChange={(checked) => {
                          const isChecked = checked === true;
                          if (isChecked) {
                            fields.forEach((_, i) => {
                              if (i !== index) {
                                setValue(`contacts.${i}.is_primary`, false);
                              }
                            });
                          }
                          checkboxField.onChange(isChecked);
                        }}
                      />
                    )}
                  />
                  <FieldLabel className="font-normal">Birincil iletişim</FieldLabel>
                </Field>
              </FieldGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TEKODAK sorumluluğu</CardTitle>
          <CardDescription>Şube ve sorumlu personel ataması</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="branch_id">Şube *</FieldLabel>
              <select
                id="branch_id"
                className={selectClassName}
                disabled={lockBranch}
                {...register("branch_id")}
              >
                <option value="">Şube seçin</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
              <FieldError errors={[errors.branch_id]} />
            </Field>

            <Field>
              <FieldLabel>Sorumlu personel *</FieldLabel>
              {!branchId ? (
                <p className="text-sm text-muted-foreground">
                  Önce şube seçin
                </p>
              ) : branchUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu şubede atanabilir personel bulunamadı
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  {branchUsers.map((user) => {
                    const checked = (responsibleIds ?? []).includes(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex flex-wrap items-center gap-3 rounded-md p-2 hover:bg-muted/40"
                      >
                        <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleResponsible(user.id, value === true)
                            }
                          />
                          <span className="text-sm">
                            {user.full_name}
                            <span className="ml-1 text-muted-foreground">
                              ({user.email})
                            </span>
                          </span>
                        </label>
                        {checked ? (
                          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="primary_responsible"
                              className="size-4"
                              checked={primaryResponsibleId === user.id}
                              onChange={() =>
                                setValue(
                                  "primary_responsible_user_id",
                                  user.id,
                                  { shouldDirty: true, shouldValidate: true },
                                )
                              }
                            />
                            Birincil
                          </label>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              <FieldError errors={[errors.responsible_user_ids]} />
              <FieldError errors={[errors.primary_responsible_user_id]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="notes">Genel notlar</FieldLabel>
            <textarea
              id="notes"
              className={textareaClassName}
              rows={4}
              {...register("notes")}
            />
          </Field>
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
          disabled={taxUnavailable || taxCheck.status === "checking"}
        >
          {isEdit ? "Güncelle" : "Müşteri Ekle"}
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
