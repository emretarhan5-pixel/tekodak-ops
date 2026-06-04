/** Application user profile (public.users), aligned with 001_initial_schema.sql */
export type UserRole = "admin" | "staff";

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  branch_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  deleted_at: string | null;
};

export const APP_USER_SELECT =
  "id, email, full_name, phone, role, branch_id, avatar_url, is_active, deleted_at" as const;
