import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions, type Permissions } from "@/lib/utils/permissions";

export type ServiceRequestApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
  branchScope: string | null;
};

export class ServiceRequestApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "ServiceRequestApiError";
  }
}

export async function getServiceRequestApiContext(): Promise<ServiceRequestApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new ServiceRequestApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new ServiceRequestApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new ServiceRequestApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.isAuthenticated) {
    throw new ServiceRequestApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }

  const branchScope = user.role === "staff" ? user.branch_id : null;

  if (user.role === "staff" && !branchScope) {
    throw new ServiceRequestApiError(
      "Personel hesabınıza şube atanmamış",
      "FORBIDDEN",
    );
  }

  return { supabase, user, permissions, branchScope };
}

export function resolveBranchFilter(
  ctx: ServiceRequestApiContext,
  requestedBranchId?: string,
): string | undefined {
  if (ctx.branchScope) {
    return ctx.branchScope;
  }
  return requestedBranchId;
}

export function assertCanAccessBranch(
  ctx: ServiceRequestApiContext,
  branchId: string,
): void {
  if (ctx.branchScope && ctx.branchScope !== branchId) {
    throw new ServiceRequestApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanEdit(ctx: ServiceRequestApiContext): void {
  if (!ctx.permissions.canEdit) {
    throw new ServiceRequestApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanEditServiceRequest(
  ctx: ServiceRequestApiContext,
  record: {
    branch_id: string;
    assigned_technician_id: string;
    status: string;
  },
): void {
  assertCanAccessBranch(ctx, record.branch_id);

  if (ctx.permissions.isAdmin) {
    return;
  }

  if (record.assigned_technician_id !== ctx.user.id) {
    throw new ServiceRequestApiError(
      "Yalnızca atanan teknisyen düzenleyebilir",
      "FORBIDDEN",
    );
  }
}

export function toActionError(error: unknown): string {
  if (error instanceof ServiceRequestApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
