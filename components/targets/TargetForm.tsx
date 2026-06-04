"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { buttonVariants } from "@/components/ui/button";
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
import { createTarget } from "@/lib/api/targets/create-target";
import { targetDetailToFormValues } from "@/lib/api/targets/target-detail-to-form-values";
import { updateTarget } from "@/lib/api/targets/update-target";
import type {
  TargetDetail,
  TargetFormAssigneeOption,
  TargetFormBranchOption,
} from "@/lib/api/targets/types";
import {
  TARGET_CURRENCIES,
  TARGET_CURRENCY_LABELS,
  TARGET_FORM_PERIOD_TYPES,
  TARGET_METRIC_TYPES,
  TARGET_METRIC_TYPE_LABELS,
  TARGET_PERIOD_TYPE_LABELS,
  TARGET_PERIOD_TYPES,
  targetMetricUsesCurrency,
  type TargetMetricType,
  type TargetPeriodType,
} from "@/lib/constants/target";
import { cn } from "@/lib/utils";
import {
  createTargetSchema,
  targetFormSchema,
  updateTargetSchema,
  type TargetFormValues,
} from "@/schemas/target";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[100px] resize-y py-2.5",
);

type TargetFormBaseProps = {
  branches: TargetFormBranchOption[];
  assignees: TargetFormAssigneeOption[];
  defaultBranchId: string | null;
  showBranchSelect: boolean;
};

type TargetFormCreateProps = TargetFormBaseProps & {
  mode: "create";
  initialData?: null;
};

type TargetFormEditProps = TargetFormBaseProps & {
  mode: "edit";
  initialData: TargetDetail;
};

type TargetFormProps = TargetFormCreateProps | TargetFormEditProps;

function emptyFormValues(defaultBranchId: string | null): TargetFormValues {
  return {
    name: "",
    description: "",
    metric_type: "revenue_contracts",
    period_type: "monthly",
    start_date: "",
    end_date: "",
    target_value: 0,
    branch_id: defaultBranchId ?? "",
    assigned_user_id: "",
    currency: "TRY",
    status: "active",
  };
}

function getPeriodOptions(periodType?: TargetPeriodType): TargetPeriodType[] {
  if (periodType === "custom") {
    return [...TARGET_PERIOD_TYPES];
  }
  return [...TARGET_FORM_PERIOD_TYPES];
}

function getTargetValueHint(metricType: TargetMetricType): string {
  switch (metricType) {
    case "revenue_contracts":
      return "Sözleşme geliri tutarını girin";
    case "response_time":
      return "Ortalama yanıt süresi hedefi (saat)";
    case "first_time_fix":
      return "İlk seferinde çözüm oranı hedefi (%)";
    default:
      return "Hedef adet değerini girin";
  }
}

export function TargetForm(props: TargetFormProps) {
  const {
    mode,
    branches,
    assignees,
    defaultBranchId,
    showBranchSelect,
  } = props;

  const isEdit = mode === "edit";
  const initialData = isEdit ? props.initialData : null;
  const targetId = isEdit ? props.initialData.id : undefined;
  const cancelHref = isEdit && targetId ? `/targets/${targetId}` : "/targets";

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedDefaults = useMemo((): TargetFormValues => {
    if (isEdit && initialData) {
      return targetDetailToFormValues(initialData);
    }
    return emptyFormValues(defaultBranchId);
  }, [isEdit, initialData, defaultBranchId]);

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: resolvedDefaults,
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const metricType = useWatch({ control, name: "metric_type" });
  const branchId = useWatch({ control, name: "branch_id" });
  const assignedUserId = useWatch({ control, name: "assigned_user_id" });
  const periodType = useWatch({ control, name: "period_type" });

  const branchAssignees = useMemo(() => {
    if (!branchId) return [];
    return assignees.filter((assignee) => assignee.branch_id === branchId);
  }, [assignees, branchId]);

  const periodOptions = useMemo(
    () => getPeriodOptions(periodType),
    [periodType],
  );

  useEffect(() => {
    if (!assignedUserId) return;
    const stillValid = branchAssignees.some(
      (assignee) => assignee.id === assignedUserId,
    );
    if (!stillValid) {
      setValue("assigned_user_id", "");
    }
  }, [assignedUserId, branchAssignees, setValue]);

  useEffect(() => {
    if (!targetMetricUsesCurrency(metricType)) {
      setValue("currency", undefined);
    } else if (!form.getValues("currency")) {
      setValue("currency", "TRY");
    }
  }, [metricType, setValue, form]);

  async function onSubmit(values: TargetFormValues) {
    setIsSubmitting(true);

    try {
      const sharedPayload = {
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
        metric_type: values.metric_type,
        period_type: values.period_type,
        start_date: values.start_date,
        end_date: values.end_date,
        target_value: values.target_value,
        branch_id: values.branch_id,
        assigned_user_id: values.assigned_user_id || null,
        currency: targetMetricUsesCurrency(values.metric_type)
          ? values.currency ?? "TRY"
          : null,
        status: isEdit && initialData ? initialData.status : "active",
      };

      if (isEdit && targetId) {
        const payload = updateTargetSchema.parse({
          id: targetId,
          ...sharedPayload,
        });

        const result = await updateTarget(payload);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Hedef güncellendi");
        router.push(`/targets/${result.data.targetId}`);
        router.refresh();
        return;
      }

      const payload = createTargetSchema.parse(sharedPayload);
      const result = await createTarget(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Hedef oluşturuldu");
      router.push(`/targets/${result.data.targetId}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Hedef kaydedilirken bir hata oluştu";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEdit ? "Hedefi Düzenle" : "Hedef bilgileri"}
        </CardTitle>
        <CardDescription>
          İlerleme otomatik hesaplanır; mevcut değer manuel girilmez.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="target-name">Hedef Adı *</FieldLabel>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="target-name"
                    placeholder="Örn. 2026 Q1 Sözleşme Geliri"
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="target-metric-type">Metrik Tip *</FieldLabel>
              <Controller
                control={control}
                name="metric_type"
                render={({ field }) => (
                  <select
                    {...field}
                    id="target-metric-type"
                    className={selectClassName}
                    disabled={isSubmitting}
                  >
                    {TARGET_METRIC_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {TARGET_METRIC_TYPE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.metric_type ? (
                <FieldError>{errors.metric_type.message}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="target-period-type">Dönem *</FieldLabel>
                <Controller
                  control={control}
                  name="period_type"
                  render={({ field }) => (
                    <select
                      {...field}
                      id="target-period-type"
                      className={selectClassName}
                      disabled={isSubmitting}
                    >
                      {periodOptions.map((value) => (
                        <option key={value} value={value}>
                          {TARGET_PERIOD_TYPE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.period_type ? (
                  <FieldError>{errors.period_type.message}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="target-branch">Şube *</FieldLabel>
                <Controller
                  control={control}
                  name="branch_id"
                  render={({ field }) => (
                    <select
                      {...field}
                      id="target-branch"
                      className={selectClassName}
                      disabled={isSubmitting || !showBranchSelect}
                    >
                      <option value="">Şube seçin</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.branch_id ? (
                  <FieldError>{errors.branch_id.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="target-start-date">Başlangıç Tarihi *</FieldLabel>
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="target-start-date"
                      type="date"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.start_date ? (
                  <FieldError>{errors.start_date.message}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="target-end-date">Bitiş Tarihi *</FieldLabel>
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="target-end-date"
                      type="date"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.end_date ? (
                  <FieldError>{errors.end_date.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <div
              className={cn(
                "grid gap-4",
                targetMetricUsesCurrency(metricType)
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-1",
              )}
            >
              {targetMetricUsesCurrency(metricType) ? (
                <Field>
                  <FieldLabel htmlFor="target-currency">Para Birimi *</FieldLabel>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <select
                        {...field}
                        id="target-currency"
                        className={selectClassName}
                        disabled={isSubmitting}
                        value={field.value ?? "TRY"}
                      >
                        {TARGET_CURRENCIES.map((value) => (
                          <option key={value} value={value}>
                            {TARGET_CURRENCY_LABELS[value]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.currency ? (
                    <FieldError>{errors.currency.message}</FieldError>
                  ) : null}
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="target-value">Hedef Değer *</FieldLabel>
                <Controller
                  control={control}
                  name="target_value"
                  render={({ field }) => (
                    <Input
                      id="target-value"
                      type="number"
                      min={0}
                      step={
                        metricType === "first_time_fix" ||
                        metricType === "response_time"
                          ? "0.1"
                          : "1"
                      }
                      disabled={isSubmitting}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={
                        Number.isNaN(field.value) || field.value === undefined
                          ? ""
                          : field.value
                      }
                      onChange={(event) => {
                        const val = event.target.value;
                        field.onChange(val === "" ? 0 : Number(val));
                      }}
                    />
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {getTargetValueHint(metricType)}
                </p>
                {errors.target_value ? (
                  <FieldError>{errors.target_value.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="target-assignee">
                Atanan Personel
              </FieldLabel>
              <Controller
                control={control}
                name="assigned_user_id"
                render={({ field }) => (
                  <select
                    {...field}
                    id="target-assignee"
                    className={selectClassName}
                    disabled={isSubmitting || !branchId}
                    value={field.value ?? ""}
                  >
                    <option value="">
                      {!branchId
                        ? "Önce şube seçin"
                        : "Personel atanmadı (şube geneli)"}
                    </option>
                    {branchAssignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.full_name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.assigned_user_id ? (
                <FieldError>{errors.assigned_user_id.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="target-description">Açıklama</FieldLabel>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="target-description"
                    className={textareaClassName}
                    placeholder="Hedef hakkında ek notlar (opsiyonel)"
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.description ? (
                <FieldError>{errors.description.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={cancelHref}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 min-h-11 w-full sm:w-auto",
                isSubmitting && "pointer-events-none opacity-50",
              )}
            >
              İptal
            </Link>
            <SubmitButton
              isLoading={isSubmitting}
              loadingText={isEdit ? "Güncelleniyor…" : "Kaydediliyor…"}
              className="h-11 min-h-11 w-full sm:w-auto sm:px-8"
            >
              {isEdit ? "Güncelle" : "Hedefi Oluştur"}
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
