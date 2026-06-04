import type { UserRole } from "@/lib/types/user";

export const USER_ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
} as const satisfies Record<string, UserRole>;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Yönetici",
  staff: "Personel",
};
