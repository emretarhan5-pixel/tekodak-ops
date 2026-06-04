import { z } from "zod";

import { CONTRACT_TYPES } from "@/lib/constants/contract";
import {
  DEFAULT_SETTINGS_TAB,
  SETTINGS_TABS,
} from "@/lib/constants/settings";
import { PART_CATEGORIES } from "@/lib/constants/stock-item";

export const settingsTabSchema = z.enum(SETTINGS_TABS).default(DEFAULT_SETTINGS_TAB);

export const settingsSearchSchema = z.object({
  tab: settingsTabSchema,
  brandId: z.string().uuid().optional(),
});

export type SettingsSearchInput = z.infer<typeof settingsSearchSchema>;

export const brandFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, "Marka adı zorunludur")
    .max(120, "Marka adı en fazla 120 karakter olabilir"),
  default_warranty_years: z.coerce
    .number()
    .int("Tam sayı girin")
    .min(0, "Garanti süresi 0 veya daha büyük olmalıdır")
    .max(30, "Garanti süresi en fazla 30 yıl olabilir"),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  description: z.string().max(500).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type BrandFormInput = z.infer<typeof brandFormSchema>;

export const deviceModelFormSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid("Marka seçin"),
  model_name: z
    .string()
    .min(1, "Model adı zorunludur")
    .max(200, "Model adı en fazla 200 karakter olabilir"),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export type DeviceModelFormInput = z.infer<typeof deviceModelFormSchema>;

const categoryCodeSchema = z
  .string()
  .min(1, "Kod zorunludur")
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/, "Kod küçük harf ve alt çizgi kullanmalıdır");

export const categoryFormSchema = z.object({
  id: z.string().uuid().optional(),
  category_type: z.enum(["contract_type", "part_category"]),
  code: categoryCodeSchema,
  display_name: z
    .string()
    .min(1, "Görünen ad zorunludur")
    .max(120, "Görünen ad en fazla 120 karakter olabilir"),
  description: z.string().max(500).optional().or(z.literal("")),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const companyProfileSchema = z
  .object({
    name: z.string().min(1, "Şirket adı zorunludur").max(200),
    address: z.string().max(500).optional().or(z.literal("")),
    phone: z.string().max(50).optional().or(z.literal("")),
    email: z.string().max(200).optional().or(z.literal("")),
    tax_number: z.string().max(32).optional().or(z.literal("")),
    logo_url: z.string().max(2000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.email?.trim()) {
      const result = z.string().email().safeParse(data.email.trim());
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Geçerli bir e-posta girin",
        });
      }
    }
    if (data.logo_url?.trim()) {
      const result = z.string().url().safeParse(data.logo_url.trim());
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["logo_url"],
          message: "Geçerli bir URL girin",
        });
      }
    }
  });

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

export function validateCategoryCodeForType(
  categoryType: "contract_type" | "part_category",
  code: string,
): string | null {
  if (categoryType === "contract_type") {
    if (!(CONTRACT_TYPES as readonly string[]).includes(code)) {
      return `Kod, sistemde tanımlı sözleşme tiplerinden biri olmalıdır (${CONTRACT_TYPES.join(", ")})`;
    }
    return null;
  }

  if (!(PART_CATEGORIES as readonly string[]).includes(code)) {
    return `Kod, sistemde tanımlı stok kategorilerinden biri olmalıdır`;
  }
  return null;
}
