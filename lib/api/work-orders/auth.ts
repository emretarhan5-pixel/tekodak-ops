import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions, type Permissions } from "@/lib/utils/permissions";

export type WorkOrderApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
  branchScope: string | null;
};

export class WorkOrderApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "WorkOrderApiError";
  }
}

export async function getWorkOrderApiContext(): Promise<WorkOrderApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new WorkOrderApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new WorkOrderApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new WorkOrderApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.isAuthenticated) {
    throw new WorkOrderApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }

  const branchScope = user.role === "staff" ? user.branch_id : null;

  if (user.role === "staff" && !branchScope) {
    throw new WorkOrderApiError(
      "Personel hesabınıza şube atanmamış",
      "FORBIDDEN",
    );
  }

  return { supabase, user, permissions, branchScope };
}

export function resolveBranchFilter(
  ctx: WorkOrderApiContext,
  requestedBranchId?: string,
): string | undefined {
  if (ctx.branchScope) {
    return ctx.branchScope;
  }
  return requestedBranchId;
}

export function assertCanAccessBranch(
  ctx: WorkOrderApiContext,
  workOrderBranchId: string,
): void {
  if (ctx.branchScope && ctx.branchScope !== workOrderBranchId) {
    throw new WorkOrderApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanEdit(ctx: WorkOrderApiContext): void {
  if (!ctx.permissions.canEdit) {
    throw new WorkOrderApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanDelete(ctx: WorkOrderApiContext): void {
  if (!ctx.permissions.canDelete) {
    throw new WorkOrderApiError(
      "İş emri silme yalnızca admin içindir",
      "FORBIDDEN",
    );
  }
}

export function toActionError(error: unknown): string {
  if (error instanceof WorkOrderApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
