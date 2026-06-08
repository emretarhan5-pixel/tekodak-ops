import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { createClient } from "@/lib/supabase/server";
import type { MaintenancePlanStatus } from "@/lib/constants/maintenance";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions, type Permissions } from "@/lib/utils/permissions";

export type MaintenanceApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
  branchScope: string | null;
};

export type MaintenancePlanAccessRow = {
  branch_id: string;
  assigned_technician_id: string;
  status: MaintenancePlanStatus;
  deleted_at: string | null;
};

export class MaintenanceApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "MaintenanceApiError";
  }
}

export async function getMaintenanceApiContext(): Promise<MaintenanceApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new MaintenanceApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new MaintenanceApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new MaintenanceApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.isAuthenticated) {
    throw new MaintenanceApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }

  const branchScope = user.role === "staff" ? user.branch_id : null;

  if (user.role === "staff" && !branchScope) {
    throw new MaintenanceApiError(
      "Personel hesabınıza şube atanmamış",
      "FORBIDDEN",
    );
  }

  return { supabase, user, permissions, branchScope };
}

export function assertCanEdit(ctx: MaintenanceApiContext): void {
  if (!ctx.permissions.canEdit) {
    throw new MaintenanceApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanAccessBranch(
  ctx: MaintenanceApiContext,
  branchId: string,
): void {
  if (ctx.branchScope && ctx.branchScope !== branchId) {
    throw new MaintenanceApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanEditMaintenancePlan(
  ctx: MaintenanceApiContext,
  row: MaintenancePlanAccessRow,
): void {
  assertCanAccessBranch(ctx, row.branch_id);

  if (row.deleted_at) {
    throw new MaintenanceApiError("Bakım planı bulunamadı", "NOT_FOUND");
  }

  if (ctx.permissions.isAdmin) {
    return;
  }

  if (row.assigned_technician_id !== ctx.user.id) {
    throw new MaintenanceApiError(
      "Bu bakım planını düzenleme yetkiniz yok",
      "FORBIDDEN",
    );
  }
}

export function assertCanCreateMaintenancePlan(
  ctx: MaintenanceApiContext,
  params: {
    branchId: string;
    assignedTechnicianId: string;
  },
): void {
  assertCanEdit(ctx);
  assertCanAccessBranch(ctx, params.branchId);

  if (ctx.permissions.isAdmin) {
    return;
  }

  if (params.assignedTechnicianId !== ctx.user.id) {
    throw new MaintenanceApiError(
      "Personel yalnızca kendine bakım planı oluşturabilir",
      "FORBIDDEN",
    );
  }
}

export function toMaintenanceError(error: unknown): string {
  if (error instanceof MaintenanceApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
