import { z } from "zod";

import {
  SERVICE_REQUEST_CUSTOMER_DECISIONS,
  SERVICE_REQUEST_DELIVERY_METHODS,
  SERVICE_REQUEST_LIST_PAGE_SIZE,
  SERVICE_REQUEST_PHOTO_STEPS,
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_VAT_OPTIONS,
} from "@/lib/constants/service-request";

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

const trimmedText = (label: string, max = 5000) =>
  z.string().trim().min(1, `${label} gereklidir`).max(max);

const optionalTrimmedText = (max = 5000) =>
  z.string().trim().max(max).optional().nullable();

export const serviceRequestFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  status: z.enum(SERVICE_REQUEST_STATUSES).optional(),
  assignedTechnicianId: z.string().uuid().optional(),
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
    .default(SERVICE_REQUEST_LIST_PAGE_SIZE),
});

const step1Fields = {
  company_name: trimmedText("Firma / kurum", 500),
  contact_name: trimmedText("Ad soyad", 200),
  phone: trimmedText("Telefon", 50),
  address: trimmedText("Adres", 2000),
  device_type: trimmedText("Cihaz türü", 200),
  brand_model: trimmedText("Marka / model", 300),
  device_model_id: optionalUuid.transform(emptyToNullUuid),
  serial_number: trimmedText("Seri no", 200),
  under_warranty: z.boolean(),
  reported_fault: trimmedText("Bildirilen arıza", 10000),
};

export const createServiceRequestSchema = z.object({
  branch_id: z.string().uuid("Geçerli bir şube seçin").optional(),
  ...step1Fields,
});

export const serviceRequestStep1FormSchema = z
  .object({
    branch_id: z.string().uuid("Geçerli bir şube seçin").optional().or(z.literal("")),
    brand_model_mode: z.enum(["catalog", "manual"]),
    ...step1Fields,
  })
  .superRefine((data, ctx) => {
    if (data.brand_model_mode === "catalog" && !data.device_model_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Listeden bir marka / model seçin veya manuel girişe geçin",
        path: ["device_model_id"],
      });
    }
    if (data.brand_model_mode === "manual" && !data.brand_model.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Marka / model gereklidir",
        path: ["brand_model"],
      });
    }
  });

export type ServiceRequestStep1FormValues = z.infer<
  typeof serviceRequestStep1FormSchema
>;

export const updateServiceRequestStep1Schema = z.object({
  id: z.string().uuid(),
  ...step1Fields,
});

export const updateServiceRequestStep2Schema = z.object({
  id: z.string().uuid(),
  diagnosed_fault: trimmedText("Tespit edilen arıza", 10000),
  customer_statement: trimmedText("Müşteri beyanı", 10000),
  technical_inspection_result: trimmedText("Teknik inceleme sonucu", 10000),
  wrong_usage_detected: z.boolean().default(false),
});

export const serviceRequestQuoteLineSchema = z.object({
  description: trimmedText("Parça açıklaması", 500),
  unit_price: z.coerce.number().min(0, "Birim fiyat 0 veya üzeri olmalıdır"),
  quantity: z.coerce.number().positive("Adet 0'dan büyük olmalıdır"),
});

export const updateServiceRequestStep3Schema = z.object({
  id: z.string().uuid(),
  quote_lines: z
    .array(serviceRequestQuoteLineSchema)
    .min(1, "En az bir teklif satırı ekleyin"),
  labor_cost: z.coerce.number().min(0, "İşçilik ücreti 0 veya üzeri olmalıdır"),
  shipping_cost: z.coerce
    .number()
    .min(0, "Kargo ücreti 0 veya üzeri olmalıdır")
    .optional()
    .nullable(),
  vat_option: z.enum(SERVICE_REQUEST_VAT_OPTIONS, {
    errorMap: () => ({ message: "KDV seçeneği seçin" }),
  }),
  quote_sent_to_customer: z.boolean(),
});

export const serviceRequestCustomerDecisionSchema = z
  .object({
    id: z.string().uuid(),
    customer_decision: z.enum(["approved", "rejected"]),
    device_returned: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.customer_decision === "rejected" && !value.device_returned) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Red durumunda cihaz iade edildi onayı gereklidir",
        path: ["device_returned"],
      });
    }
  });

export const updateServiceRequestStep4Schema = z.object({
  id: z.string().uuid(),
  work_description: trimmedText("Yapılan işin açıklaması", 10000),
  delivery_method: z.enum(SERVICE_REQUEST_DELIVERY_METHODS, {
    errorMap: () => ({ message: "Teslim şekli seçin" }),
  }),
  delivered: z.boolean(),
});

export const updateServiceRequestStep5Schema = z.object({
  id: z.string().uuid(),
  invoice_issued: z.boolean(),
  invoice_number: trimmedText("Fatura no", 100),
  payment_received: z.literal(true, {
    errorMap: () => ({
      message: "İşi kapatmak için ödeme alındı onayı gereklidir",
    }),
  }),
});

export const addServiceRequestPartSchema = z.object({
  serviceRequestId: z.string().uuid(),
  partId: z.string().uuid(),
  quantity: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır"),
  notes: optionalTrimmedText(500),
});

export const removeServiceRequestPartSchema = z.object({
  partRowId: z.string().uuid(),
});

export const uploadServiceRequestPhotoSchema = z.object({
  serviceRequestId: z.string().uuid(),
  step: z.coerce
    .number()
    .int()
    .refine(
      (value): value is (typeof SERVICE_REQUEST_PHOTO_STEPS)[number] =>
        (SERVICE_REQUEST_PHOTO_STEPS as readonly number[]).includes(value),
      { message: "Geçersiz fotoğraf adımı" },
    ),
});

export type ServiceRequestFilterInput = z.infer<typeof serviceRequestFilterSchema>;
export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type UpdateServiceRequestStep1Input = z.infer<
  typeof updateServiceRequestStep1Schema
>;
export type UpdateServiceRequestStep2Input = z.infer<
  typeof updateServiceRequestStep2Schema
>;
export type ServiceRequestQuoteLineInput = z.infer<
  typeof serviceRequestQuoteLineSchema
>;
export type UpdateServiceRequestStep3Input = z.infer<
  typeof updateServiceRequestStep3Schema
>;
export type ServiceRequestCustomerDecisionInput = z.infer<
  typeof serviceRequestCustomerDecisionSchema
>;
export type UpdateServiceRequestStep4Input = z.infer<
  typeof updateServiceRequestStep4Schema
>;
export type UpdateServiceRequestStep5Input = z.infer<
  typeof updateServiceRequestStep5Schema
>;
export type AddServiceRequestPartInput = z.infer<typeof addServiceRequestPartSchema>;
