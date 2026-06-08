import { z } from "zod";

import {
  CONTRACT_CURRENCIES,
  CONTRACT_LIST_FILTERS,
  CONTRACT_LIST_PAGE_SIZE,
  CONTRACT_PAYMENT_METHODS,
  CONTRACT_RENEWAL_BADGES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  CONTRACT_WORKING_HOURS,
} from "@/lib/constants/contract";

export const contractFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  renewalBadge: z.enum(CONTRACT_RENEWAL_BADGES).optional(),
  listFilter: z.enum(CONTRACT_LIST_FILTERS).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(CONTRACT_LIST_PAGE_SIZE),
});

const publishStatuses = ["draft", "active"] as const;

const contractCoreFields = {
  customer_id: z.string().uuid("Geçerli bir müşteri seçin"),
  contract_type: z.enum(CONTRACT_TYPES, {
    errorMap: () => ({ message: "Sözleşme tipi seçin" }),
  }),
  start_date: z
    .string()
    .min(1, "Başlangıç tarihi gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
  end_date: z
    .string()
    .min(1, "Bitiş tarihi gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
  currency: z.enum(CONTRACT_CURRENCIES, {
    errorMap: () => ({ message: "Para birimi seçin" }),
  }),
  agreed_price: z.coerce
    .number({ invalid_type_error: "Anlaşılan tutar sayı olmalıdır" })
    .positive("Anlaşılan tutar 0'dan büyük olmalıdır"),
  list_price: z.coerce
    .number()
    .nonnegative()
    .optional()
    .nullable(),
  minimum_price: z.coerce
    .number()
    .nonnegative()
    .optional()
    .nullable(),
  override_reason: z.string().max(2000).optional().nullable(),
  payment_method: z.enum(CONTRACT_PAYMENT_METHODS, {
    errorMap: () => ({ message: "Ödeme koşulu seçin" }),
  }),
  annual_maintenance_count: z.coerce.number().int().min(0).default(0),
  total_maintenance_count: z.coerce.number().int().min(0).default(0),
  sla_response_hours: z.coerce.number().int().min(1).default(48),
  parts_included: z.boolean().default(true),
  travel_included: z.boolean().default(true),
  working_hours: z.enum(CONTRACT_WORKING_HOURS).default("business"),
  vat_included: z.boolean().default(true),
  vat_rate: z.coerce.number().min(0).max(100).default(20),
  responsible_user_id: z.string().uuid("Sorumlu kullanıcı seçin"),
  special_terms: z.string().max(10000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  device_ids: z.array(z.string().uuid()).default([]),
  status: z.enum(publishStatuses, {
    errorMap: () => ({ message: "Geçersiz durum" }),
  }),
  renewed_from_id: z.string().uuid().optional().nullable(),
};

function validateDates(data: {
  start_date: string;
  end_date: string;
}): boolean {
  return data.end_date >= data.start_date;
}

function validatePriceRange(data: {
  agreed_price: number;
  list_price?: number | null;
  minimum_price?: number | null;
  override_reason?: string | null;
}): boolean {
  const list = data.list_price;
  const min = data.minimum_price;
  if (list == null || min == null) {
    return true;
  }
  if (data.agreed_price >= min && data.agreed_price <= list) {
    return true;
  }
  const reason = data.override_reason?.trim();
  return Boolean(reason && reason.length > 0);
}

export const createContractSchema = z
  .object(contractCoreFields)
  .refine(validateDates, {
    message: "Bitiş tarihi başlangıçtan önce olamaz",
    path: ["end_date"],
  })
  .refine(validatePriceRange, {
    message:
      "Tutar liste fiyat aralığının dışında; gerekçe (override_reason) girin",
    path: ["override_reason"],
  });

/** Düzenleme: tüm status değerleri (mevcut kayıt korunur) */
export const contractEditFormSchema = z
  .object({
    ...contractCoreFields,
    id: z.string().uuid("Geçersiz sözleşme kimliği"),
    status: z.enum(CONTRACT_STATUSES),
  })
  .refine(validateDates, {
    message: "Bitiş tarihi başlangıçtan önce olamaz",
    path: ["end_date"],
  })
  .refine(validatePriceRange, {
    message:
      "Tutar liste fiyat aralığının dışında; gerekçe (override_reason) girin",
    path: ["override_reason"],
  });

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type ContractFormValues = CreateContractInput;
export type ContractEditFormValues = z.infer<typeof contractEditFormSchema>;
export type UpdateContractInput = ContractEditFormValues;
export type ContractFilterInput = z.infer<typeof contractFilterSchema>;
