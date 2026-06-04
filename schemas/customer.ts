import { z } from "zod";

import { CUSTOMER_TYPES } from "@/lib/constants/customer";
import { isValidTaxNumber, normalizeTaxNumber } from "@/lib/utils/tax-number";
import {
  isValidTurkishPhone,
  normalizeTurkishPhone,
} from "@/lib/utils/phone";

const optionalEmail = z
  .string()
  .email("Geçerli bir e-posta adresi girin")
  .optional()
  .nullable()
  .or(z.literal(""));

const optionalUrl = z
  .string()
  .url("Geçerli bir web adresi girin")
  .optional()
  .nullable()
  .or(z.literal(""));

const phoneSchema = z
  .string()
  .min(1, "Telefon numarası gereklidir")
  .refine((v) => isValidTurkishPhone(v), {
    message: "Geçerli bir telefon numarası girin (10 hane)",
  })
  .transform((v) => normalizeTurkishPhone(v));

const taxNumberSchema = z
  .string()
  .min(1, "Vergi numarası gereklidir")
  .refine((v) => isValidTaxNumber(v), {
    message: "Vergi numarası 10 veya 11 haneli olmalıdır",
  })
  .transform((v) => normalizeTaxNumber(v));

export const customerContactSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(1, "İlgili kişi adı gereklidir"),
  title: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || isValidTurkishPhone(v), {
      message: "Geçerli bir telefon numarası girin",
    })
    .transform((v) => (v ? normalizeTurkishPhone(v) : null)),
  email: optionalEmail,
  is_primary: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const customerContactFormRowSchema = z.object({
  full_name: z.string(),
  title: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
  email: z.string().optional().nullable().or(z.literal("")),
  is_primary: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Kurum adı gereklidir").max(500),
  tax_office: z.string().optional().nullable(),
  tax_number: taxNumberSchema,
  customer_type: z.enum(CUSTOMER_TYPES, {
    errorMap: () => ({ message: "Müşteri tipi seçin" }),
  }),
  sector: z.string().optional().nullable(),
  main_phone: phoneSchema,
  email: optionalEmail,
  website: optionalUrl,
  city: z.string().min(1, "İl gereklidir"),
  district: z.string().optional().nullable(),
  full_address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  branch_id: z.string().uuid("Geçerli bir şube seçin"),
  contacts: z.array(customerContactSchema).default([]),
  responsible_user_ids: z
    .array(z.string().uuid())
    .min(1, "En az bir sorumlu personel seçin"),
});

export const customerFormSchema = createCustomerSchema
  .omit({ contacts: true })
  .extend({
    contacts: z
      .array(customerContactFormRowSchema)
      .max(10, "En fazla 10 ilgili kişi ekleyebilirsiniz")
      .default([]),
    primary_responsible_user_id: z
      .string()
      .uuid("Birincil sorumlu personel seçin"),
  })
  .superRefine((data, ctx) => {
    if (
      data.responsible_user_ids.length > 0 &&
      !data.responsible_user_ids.includes(data.primary_responsible_user_id)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primary_responsible_user_id"],
        message: "Birincil sorumlu, seçili personel listesinde olmalıdır",
      });
    }

    for (const [index, contact] of data.contacts.entries()) {
      const name = contact.full_name.trim();
      const hasOther =
        Boolean(contact.title?.trim()) ||
        Boolean(contact.phone?.trim()) ||
        Boolean(contact.email?.trim()) ||
        Boolean(contact.notes?.trim());

      if (!name && hasOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contacts", index, "full_name"],
          message: "İlgili kişi adı gereklidir",
        });
      }

      if (name && contact.phone?.trim() && !isValidTurkishPhone(contact.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contacts", index, "phone"],
          message: "Geçerli bir telefon numarası girin",
        });
      }

      if (name && contact.email?.trim()) {
        const emailResult = z.string().email().safeParse(contact.email.trim());
        if (!emailResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["contacts", index, "email"],
            message: "Geçerli bir e-posta adresi girin",
          });
        }
      }
    }
  });

export const updateCustomerSchema = createCustomerSchema.extend({
  id: z.string().uuid("Geçersiz müşteri kimliği"),
});

export const CONTRACT_STATUS_FILTERS = [
  "active",
  "renewal_soon",
  "expiring_soon",
  "expired",
  "none",
] as const;

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  sector: z.string().optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  contractStatus: z.enum(CONTRACT_STATUS_FILTERS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;
export type CustomerContactInput = z.infer<typeof customerContactSchema>;
