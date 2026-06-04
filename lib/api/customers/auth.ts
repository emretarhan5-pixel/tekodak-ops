import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions, type Permissions } from "@/lib/utils/permissions";

export type CustomerApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
  /** Staff: fixed branch. Admin: optional filter from query. */
  branchScope: string | null;
};

export class CustomerApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "CustomerApiError";
  }
}

export async function getCustomerApiContext(): Promise<CustomerApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new CustomerApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new CustomerApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new CustomerApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.isAuthenticated) {
    throw new CustomerApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }

  const branchScope =
    user.role === "staff" ? user.branch_id : null;

  if (user.role === "staff" && !branchScope) {
    throw new CustomerApiError(
      "Personel hesabınıza şube atanmamış",
      "FORBIDDEN",
    );
  }

  return { supabase, user, permissions, branchScope };
}

export function resolveBranchFilter(
  ctx: CustomerApiContext,
  requestedBranchId?: string,
): string | undefined {
  if (ctx.branchScope) {
    return ctx.branchScope;
  }
  return requestedBranchId;
}

export function assertCanAccessBranch(
  ctx: CustomerApiContext,
  branchId: string,
): void {
  if (ctx.branchScope && ctx.branchScope !== branchId) {
    throw new CustomerApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanEdit(ctx: CustomerApiContext): void {
  if (!ctx.permissions.canEdit) {
    throw new CustomerApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanDelete(ctx: CustomerApiContext): void {
  if (!ctx.permissions.canDelete) {
    throw new CustomerApiError("Müşteri silme yalnızca admin içindir", "FORBIDDEN");
  }
}

export function assertCanExport(ctx: CustomerApiContext): void {
  if (!ctx.permissions.canExport) {
    throw new CustomerApiError("Dışa aktarma yalnızca admin içindir", "FORBIDDEN");
  }
}

export function toActionError(error: unknown): string {
  if (error instanceof CustomerApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
