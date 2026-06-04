import { z } from "zod";

import { INVENTORY_MOVEMENT_TYPES } from "@/lib/constants/stock-movement";
import { STOCK_LIST_PAGE_SIZE } from "@/lib/constants/stock-item";
import { STOCK_MOVEMENT_KINDS } from "@/lib/constants/stock-movement";

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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const createStockMovementSchema = z
  .object({
    kind: z.enum(STOCK_MOVEMENT_KINDS, {
      errorMap: () => ({ message: "Hareket tipi seçin" }),
    }),
    part_id: z.string().uuid("Geçerli bir ürün seçin"),
    branch_id: z.string().uuid("Geçerli bir şube seçin"),
    quantity: z.coerce.number().max(999_999_999),
    reason: z
      .string()
      .min(1, "Sebep / açıklama gereklidir")
      .max(2000)
      .transform((v) => v.trim()),
    notes: z.string().max(10000).optional().nullable(),
    work_order_id: optionalUuid.transform(emptyToNullUuid),
    target_branch_id: optionalUuid.transform(emptyToNullUuid),
    movement_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "adjustment") {
      if (data.quantity < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sayım sonucu negatif olamaz",
          path: ["quantity"],
        });
      }
      return;
    }

    if (data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Miktar sıfırdan büyük olmalıdır",
        path: ["quantity"],
      });
    }

    if (data.kind === "transfer") {
      if (!data.target_branch_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transfer için hedef şube seçin",
          path: ["target_branch_id"],
        });
      } else if (data.target_branch_id === data.branch_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kaynak ve hedef şube farklı olmalıdır",
          path: ["target_branch_id"],
        });
      }
    }
  });

export const stockMovementFormSchema = z
  .object({
    kind: z.enum(STOCK_MOVEMENT_KINDS, {
      errorMap: () => ({ message: "Hareket tipi seçin" }),
    }),
    quantity: z.coerce.number().max(999_999_999),
    movement_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
    reason: z.string().min(1, "Sebep / açıklama gereklidir").max(2000),
    work_order_id: z.string().optional().or(z.literal("")),
    target_branch_id: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "adjustment") {
      if (data.quantity < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sayım sonucu negatif olamaz",
          path: ["quantity"],
        });
      }
      return;
    }

    if (data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Miktar sıfırdan büyük olmalıdır",
        path: ["quantity"],
      });
    }

    if (data.kind === "transfer" && !data.target_branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transfer için hedef şube seçin",
        path: ["target_branch_id"],
      });
    }
  });

export type StockMovementFormValues = z.infer<typeof stockMovementFormSchema>;

export function defaultStockMovementFormValues(): StockMovementFormValues {
  return {
    kind: "in",
    quantity: 1,
    movement_date: todayIsoDate(),
    reason: "",
    work_order_id: "",
    target_branch_id: "",
  };
}

export const stockMovementFilterSchema = z.object({
  partId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  movementType: z.enum(INVENTORY_MOVEMENT_TYPES).optional(),
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
    .default(STOCK_LIST_PAGE_SIZE),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type StockMovementFilterInput = z.infer<typeof stockMovementFilterSchema>;
