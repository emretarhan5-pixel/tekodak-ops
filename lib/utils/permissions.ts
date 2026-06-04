import type { AppUser } from "@/lib/types/user";

export type Permissions = {
  isAdmin: boolean;
  isStaff: boolean;
  isAuthenticated: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canAccessSettings: boolean;
  canManageUsers: boolean;
};

/** Layer 1 (UI) permission map — always pair with middleware + RLS */
export function getPermissions(user: AppUser | null | undefined): Permissions {
  const isAuthenticated = !!user && user.is_active && !user.deleted_at;
  const isAdmin = isAuthenticated && user.role === "admin";
  const isStaff = isAuthenticated && user.role === "staff";

  return {
    isAdmin,
    isStaff,
    isAuthenticated,
    canEdit: isAuthenticated,
    canDelete: isAdmin,
    canExport: isAdmin,
    canAccessSettings: isAdmin,
    canManageUsers: isAdmin,
  };
}
