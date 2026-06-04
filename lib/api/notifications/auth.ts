"use server";

import {
  NotificationApiError,
  type NotificationApiContext,
} from "@/lib/api/notifications/auth.types";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types/user";
import { APP_USER_SELECT } from "@/lib/types/user";

export async function getNotificationApiContext(): Promise<NotificationApiContext> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new NotificationApiError("Oturum açmanız gerekiyor", "UNAUTHORIZED");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    throw new NotificationApiError("Kullanıcı profili bulunamadı", "UNAUTHORIZED");
  }

  const user = profile as AppUser;

  if (!user.is_active || user.deleted_at) {
    throw new NotificationApiError("Hesabınız aktif değil", "FORBIDDEN");
  }

  return { supabase, user };
}
