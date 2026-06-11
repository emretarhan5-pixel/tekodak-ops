import { z } from "zod";

import { USER_ROLES } from "@/lib/constants/roles";

const roleSchema = z.enum([USER_ROLES.ADMIN, USER_ROLES.STAFF], {
  errorMap: () => ({ message: "Rol seçin" }),
});

export const inviteUserSchema = z
  .object({
    full_name: z
      .string()
      .min(3, "Ad soyad en az 3 karakter olmalıdır")
      .max(200),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    role: roleSchema,
    branch_id: z
      .union([z.string().uuid(), z.literal("")])
      .optional()
      .nullable(),
    temporary_password: z
      .string()
      .min(8, "Geçici şifre en az 8 karakter olmalıdır")
      .max(72)
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.role === USER_ROLES.STAFF && !data.branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_id"],
        message: "Personel için şube seçimi zorunludur",
      });
    }
    if (data.role === USER_ROLES.ADMIN && data.branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_id"],
        message: "Yönetici hesabına şube atanamaz",
      });
    }
  });

export const updateUserSchema = z
  .object({
    id: z.string().uuid(),
    full_name: z
      .string()
      .min(3, "Ad soyad en az 3 karakter olmalıdır")
      .max(200),
    role: roleSchema,
    branch_id: z
      .union([z.string().uuid(), z.literal("")])
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === USER_ROLES.STAFF && !data.branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_id"],
        message: "Personel için şube seçimi zorunludur",
      });
    }
    if (data.role === USER_ROLES.ADMIN && data.branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_id"],
        message: "Yönetici hesabına şube atanamaz",
      });
    }
  });

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
