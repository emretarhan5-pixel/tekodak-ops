"use server";

import {
  SettingsApiError,
  type SettingsApiContext,
} from "@/lib/api/settings/auth.types";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";
import { getPermissions } from "@/lib/utils/permissions";

export async function getSettingsApiContext(): Promise<SettingsApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new SettingsApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new SettingsApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new SettingsApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  const permissions = getPermissions(user);

  if (!permissions.canAccessSettings) {
    throw new SettingsApiError("Bu işlem yalnızca yöneticiler içindir", "FORBIDDEN");
  }

  return { supabase, user, permissions };
}
