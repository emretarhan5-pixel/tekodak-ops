import { z } from "zod";

import {
  WORK_ORDER_LIST_PAGE_SIZE,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_TYPES,
} from "@/lib/constants/work-order";

export const workOrderFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  status: z.enum(WORK_ORDER_STATUSES).optional(),
  workType: z.enum(WORK_ORDER_TYPES).optional(),
  priority: z.enum(WORK_ORDER_PRIORITIES).optional(),
  assignedTo: z.string().uuid().optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(WORK_ORDER_LIST_PAGE_SIZE),
});

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .nullable()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
  .optional()
  .nullable()
  .or(z.literal(""));

const optionalTime = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Geçerli bir saat girin")
  .optional()
  .nullable()
  .or(z.literal(""));

function emptyToNullUuid(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

function emptyToNullDate(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

function emptyToNullTime(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const t = value.length === 5 ? `${value}:00` : value;
  return t;
}

const workOrderCoreFields = {
  customer_id: z.string().uuid("Geçerli bir müşteri seçin"),
  device_id: optionalUuid.transform(emptyToNullUuid),
  contract_id: optionalUuid.transform(emptyToNullUuid),
  work_type: z.enum(WORK_ORDER_TYPES, {
    errorMap: () => ({ message: "İş tipi seçin" }),
  }),
  priority: z.enum(WORK_ORDER_PRIORITIES, {
    errorMap: () => ({ message: "Öncelik seçin" }),
  }),
  assigned_to: optionalUuid.transform(emptyToNullUuid),
  problem_description: z
    .string()
    .min(1, "Yapılacak iş / açıklama gereklidir")
    .max(10000),
  scheduled_date: optionalDate.transform(emptyToNullDate),
  scheduled_time: optionalTime.transform(emptyToNullTime),
  service_location: z.string().max(500).optional().nullable(),
  service_location_note: z.string().max(2000).optional().nullable(),
  internal_notes: z.string().max(10000).optional().nullable(),
};

export const createWorkOrderSchema = z.object(workOrderCoreFields);

/** Form: çoklu personel seçimi (DB `assigned_to` tek UUID — birincil atanan kaydedilir). */
export const workOrderFormSchema = createWorkOrderSchema
  .omit({ assigned_to: true })
  .extend({
    assigned_user_ids: z.array(z.string().uuid()).default([]),
  });

export const workOrderEditFormSchema = z.object({
  ...workOrderCoreFields,
  id: z.string().uuid("Geçersiz iş emri kimliği"),
  status: z.enum(WORK_ORDER_STATUSES),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>;
export type WorkOrderEditFormValues = z.infer<typeof workOrderEditFormSchema>;
export type UpdateWorkOrderInput = WorkOrderEditFormValues;
export type WorkOrderFilterInput = z.infer<typeof workOrderFilterSchema>;

export const addWorkOrderNoteSchema = z.object({
  workOrderId: z.string().uuid(),
  description: z
    .string()
    .min(1, "Not metni gereklidir")
    .max(5000, "Not en fazla 5000 karakter olabilir"),
});

export type AddWorkOrderNoteInput = z.infer<typeof addWorkOrderNoteSchema>;

export const addWorkOrderPartSchema = z.object({
  workOrderId: z.string().uuid("Geçersiz iş emri kimliği"),
  partId: z.string().uuid("Parça seçin"),
  quantity: z.coerce
    .number()
    .min(0.01, "Miktar 0'dan büyük olmalıdır")
    .max(999_999_999),
  notes: z.string().max(500).optional().nullable().or(z.literal("")),
});

export type AddWorkOrderPartInput = z.infer<typeof addWorkOrderPartSchema>;
