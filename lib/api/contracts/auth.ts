import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions, type Permissions } from "@/lib/utils/permissions";

export type ContractApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
  branchScope: string | null;
};

export class ContractApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "ContractApiError";
  }
}

export async function getContractApiContext(): Promise<ContractApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new ContractApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new ContractApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new ContractApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.isAuthenticated) {
    throw new ContractApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }

  const branchScope = user.role === "staff" ? user.branch_id : null;

  if (user.role === "staff" && !branchScope) {
    throw new ContractApiError(
      "Personel hesabınıza şube atanmamış",
      "FORBIDDEN",
    );
  }

  return { supabase, user, permissions, branchScope };
}

export function resolveBranchFilter(
  ctx: ContractApiContext,
  requestedBranchId?: string,
): string | undefined {
  if (ctx.branchScope) {
    return ctx.branchScope;
  }
  return requestedBranchId;
}

export function assertCanAccessBranch(
  ctx: ContractApiContext,
  contractBranchId: string,
): void {
  if (ctx.branchScope && ctx.branchScope !== contractBranchId) {
    throw new ContractApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanEdit(ctx: ContractApiContext): void {
  if (!ctx.permissions.canEdit) {
    throw new ContractApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }
}

export function assertCanDelete(ctx: ContractApiContext): void {
  if (!ctx.permissions.canDelete) {
    throw new ContractApiError(
      "Sözleşme silme yalnızca admin içindir",
      "FORBIDDEN",
    );
  }
}

export function toActionError(error: unknown): string {
  if (error instanceof ContractApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
