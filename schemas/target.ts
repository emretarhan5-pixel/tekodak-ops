import { z } from "zod";

import {
  TARGET_ALL_METRIC_TYPES,
  TARGET_CURRENCIES,
  TARGET_FILTER_PERIOD_TYPES,
  TARGET_FORM_PERIOD_TYPES,
  TARGET_LIST_PAGE_SIZE,
  TARGET_METRIC_TYPES,
  TARGET_PERIOD_TYPES,
  TARGET_STATUSES,
} from "@/lib/constants/target";

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .nullable()
  .or(z.literal(""));

function emptyToNullUuid(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

function emptyToNullString(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

const positiveTargetValue = z.coerce
  .number()
  .positive("Hedef değer 0'dan büyük olmalıdır")
  .max(999_999_999_999);

const targetCoreFields = {
  name: z
    .string()
    .min(1, "Hedef adı gereklidir")
    .max(200, "Hedef adı en fazla 200 karakter olabilir"),
  description: z.string().max(2000).optional().or(z.literal("")),
  metric_type: z.enum(TARGET_METRIC_TYPES, {
    errorMap: () => ({ message: "Hedef tipi seçin" }),
  }),
  period_type: z.enum(TARGET_PERIOD_TYPES, {
    errorMap: () => ({ message: "Dönem tipi seçin" }),
  }),
  start_date: z
    .string()
    .min(1, "Başlangıç tarihi gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir başlangıç tarihi girin"),
  end_date: z
    .string()
    .min(1, "Bitiş tarihi gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir bitiş tarihi girin"),
  target_value: positiveTargetValue,
  branch_id: z
    .string()
    .min(1, "Şube seçin")
    .uuid("Geçerli bir şube seçin"),
  assigned_user_id: optionalUuid.or(z.literal("")),
  currency: z.enum(TARGET_CURRENCIES).optional(),
  status: z.enum(TARGET_STATUSES),
};

const targetDateRefine = {
  refine: (data: { end_date: string; start_date: string }) =>
    data.end_date > data.start_date,
  message: "Bitiş tarihi başlangıçtan sonra olmalıdır",
  path: ["end_date"] as const,
};

export const targetFormSchema = z
  .object(targetCoreFields)
  .refine(targetDateRefine.refine, {
    message: targetDateRefine.message,
    path: [...targetDateRefine.path],
  })
  .refine(
    (data) =>
      data.metric_type !== "revenue_contracts" ||
      (data.currency != null && TARGET_CURRENCIES.includes(data.currency)),
    {
      message: "Sözleşme geliri hedefleri için para birimi seçin",
      path: ["currency"],
    },
  );

export type TargetFormValues = z.infer<typeof targetFormSchema>;

export const createTargetSchema = z
  .object({
    name: z
      .string()
      .min(1, "Hedef adı gereklidir")
      .max(200, "Hedef adı en fazla 200 karakter olabilir")
      .transform((value) => value.trim()),
    description: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .transform(emptyToNullString),
    metric_type: z.enum(TARGET_METRIC_TYPES, {
      errorMap: () => ({ message: "Hedef tipi seçin" }),
    }),
    period_type: z.enum(TARGET_PERIOD_TYPES, {
      errorMap: () => ({ message: "Dönem tipi seçin" }),
    }),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir başlangıç tarihi girin"),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir bitiş tarihi girin"),
    target_value: positiveTargetValue,
    branch_id: z.string().uuid("Geçerli bir şube seçin"),
    assigned_user_id: optionalUuid.transform(emptyToNullUuid),
    currency: z.enum(TARGET_CURRENCIES).optional().nullable(),
    status: z.enum(TARGET_STATUSES).default("active"),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "Bitiş tarihi başlangıçtan sonra olmalıdır",
    path: ["end_date"],
  });

export const updateTargetSchema = createTargetSchema.and(
  z.object({
    id: z.string().uuid("Geçersiz hedef kimliği"),
  }),
);

export type CreateTargetInput = z.infer<typeof createTargetSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;

export const targetFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  metricType: z.enum(TARGET_ALL_METRIC_TYPES).optional(),
  periodType: z.enum(TARGET_FILTER_PERIOD_TYPES).optional(),
  status: z.enum(TARGET_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(TARGET_LIST_PAGE_SIZE),
});

export type TargetFilterInput = z.infer<typeof targetFilterSchema>;
