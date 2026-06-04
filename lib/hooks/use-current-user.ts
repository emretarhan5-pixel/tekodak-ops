"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { APP_USER_SELECT, type AppUser } from "@/lib/types/user";

async function fetchCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = data as AppUser;

  if (!profile.is_active || profile.deleted_at) {
    return null;
  }

  return profile;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: 1,
  });
}
