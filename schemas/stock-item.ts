import { z } from "zod";

import {
  PART_CATEGORIES,
  PART_UNITS,
  STOCK_LIST_PAGE_SIZE,
  STOCK_STATUS_FILTERS,
} from "@/lib/constants/stock-item";

export const stockItemFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  category: z.enum(PART_CATEGORIES).optional(),
  status: z.enum(STOCK_STATUS_FILTERS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(STOCK_LIST_PAGE_SIZE),
});

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

const positiveNumber = z.coerce
  .number()
  .min(0, "Negatif olamaz")
  .max(999_999_999);

const optionalPositiveNumber = positiveNumber.optional().nullable();

export const createStockItemSchema = z.object({
  part_code: z
    .string()
    .min(1, "Ürün kodu gereklidir")
    .max(100)
    .transform((v) => v.trim().toUpperCase()),
  description: z
    .string()
    .min(1, "Ürün adı gereklidir")
    .max(500)
    .transform((v) => v.trim()),
  category: z.enum(PART_CATEGORIES, {
    errorMap: () => ({ message: "Kategori seçin" }),
  }),
  unit: z.enum(PART_UNITS, {
    errorMap: () => ({ message: "Birim seçin" }),
  }),
  branch_id: z.string().uuid("Geçerli bir şube seçin"),
  min_stock: positiveNumber.default(0),
  max_stock: optionalPositiveNumber,
  initial_quantity: optionalPositiveNumber,
  notes: z.string().max(10000).optional().nullable(),
  brand_id: optionalUuid.transform(emptyToNullUuid),
  list_price: optionalPositiveNumber,
  minimum_price: optionalPositiveNumber,
  unit_cost: optionalPositiveNumber,
  supplier_name: z.string().max(200).optional().nullable().transform(emptyToNullString),
  supplier_code: z.string().max(100).optional().nullable().transform(emptyToNullString),
});

export const updateStockItemSchema = createStockItemSchema
  .omit({ initial_quantity: true })
  .extend({
    part_id: z.string().uuid("Geçersiz stok ürün kimliği"),
  });

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>;
export type StockItemFilterInput = z.infer<typeof stockItemFilterSchema>;

export const stockItemFormSchema = z.object({
  part_code: z
    .string()
    .min(1, "Ürün kodu gereklidir")
    .max(100, "Ürün kodu en fazla 100 karakter olabilir"),
  description: z
    .string()
    .min(1, "Ürün adı gereklidir")
    .max(500, "Ürün adı en fazla 500 karakter olabilir"),
  category: z.enum(PART_CATEGORIES, {
    errorMap: () => ({ message: "Kategori seçin" }),
  }),
  brand_id: optionalUuid.or(z.literal("")),
  unit: z.enum(PART_UNITS, {
    errorMap: () => ({ message: "Birim seçin" }),
  }),
  min_stock: z.coerce
    .number()
    .min(0, "Kritik seviye negatif olamaz")
    .max(999_999_999),
  branch_id: z.string().uuid("Geçerli bir şube seçin"),
  initial_quantity: z.coerce
    .number()
    .min(0, "Başlangıç stoku negatif olamaz")
    .max(999_999_999),
  notes: z.string().max(10000).optional().or(z.literal("")),
});

export type StockItemFormValues = z.infer<typeof stockItemFormSchema>;
