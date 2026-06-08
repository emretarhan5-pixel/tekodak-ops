import { z } from "zod";

import { DEVICE_LIST_PAGE_SIZE, DEVICE_STATUSES } from "@/lib/constants/device";

export const WARRANTY_FILTER_VALUES = [
  "active",
  "warning_90",
  "critical_30",
  "expired",
] as const;

export type WarrantyFilterValue = (typeof WARRANTY_FILTER_VALUES)[number];

export const deviceFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  warrantyStatus: z.enum(WARRANTY_FILTER_VALUES).optional(),
  status: z.enum(DEVICE_STATUSES).optional(),
  showScrapped: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) return true;
      if (value === false || value === "false") return false;
      return true;
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEVICE_LIST_PAGE_SIZE),
});

const optionalDateString = z
  .string()
  .optional()
  .nullable()
  .or(z.literal(""));

function parseOptionalDate(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return value;
}

export const createDeviceSchema = z.object({
  customer_id: z.string().uuid("Geçerli bir müşteri seçin"),
  brand_id: z.string().uuid("Marka seçin"),
  model_id: z.string().uuid("Model seçin"),
  serial_number: z
    .string()
    .min(1, "Seri numarası gereklidir")
    .max(200)
    .transform((s) => s.trim()),
  manufacturing_year: z.coerce
    .number()
    .int()
    .min(1970)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  installation_date: optionalDateString.transform(parseOptionalDate),
  warranty_end_date: optionalDateString.transform(parseOptionalDate),
  location_address: z.string().max(2000).optional().nullable(),
  status: z.enum(DEVICE_STATUSES, {
    errorMap: () => ({ message: "Cihaz durumu seçin" }),
  }),
  notes: z.string().max(10000).optional().nullable(),
});

export const updateDeviceSchema = createDeviceSchema.partial().extend({
  id: z.string().uuid("Geçersiz cihaz kimliği"),
});

/** Düzenleme formu: tüm alanlar zorunlu + id */
export const deviceEditFormSchema = createDeviceSchema.extend({
  id: z.string().uuid("Geçersiz cihaz kimliği"),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type DeviceFormValues = CreateDeviceInput;
export type DeviceEditFormValues = z.infer<typeof deviceEditFormSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DeviceFilterInput = z.infer<typeof deviceFilterSchema>;
