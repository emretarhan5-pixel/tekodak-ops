import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions, type Permissions } from "@/lib/utils/permissions";

export type ReportApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
  branchScope: string | null;
};

export class ReportApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "ReportApiError";
  }
}

export async function getReportApiContext(): Promise<ReportApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new ReportApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new ReportApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new ReportApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.isAuthenticated) {
    throw new ReportApiError("Bu işlem için yetkiniz yok", "FORBIDDEN");
  }

  const branchScope = user.role === "staff" ? user.branch_id : null;

  if (user.role === "staff" && !branchScope) {
    throw new ReportApiError(
      "Personel hesabınıza şube atanmamış",
      "FORBIDDEN",
    );
  }

  return { supabase, user, permissions, branchScope };
}

export function resolveBranchFilter(
  ctx: ReportApiContext,
  requestedBranchId?: string,
): string | undefined {
  if (ctx.branchScope) {
    return ctx.branchScope;
  }
  return requestedBranchId;
}

export function toActionError(error: unknown): string {
  if (error instanceof ReportApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
