import { createClient } from "@/lib/supabase/server";
import { APP_USER_SELECT, type AppUser } from "@/lib/types/user";

export type DashboardUser = AppUser & {
  branch_name: string | null;
};

export async function getDashboardUser(): Promise<DashboardUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const appUser = profile as AppUser;

  if (!appUser.is_active || appUser.deleted_at) {
    return null;
  }

  let branch_name: string | null = null;

  if (appUser.branch_id) {
    const { data: branch } = await supabase
      .from("branches")
      .select("name")
      .eq("id", appUser.branch_id)
      .maybeSingle();

    branch_name = (branch as { name: string } | null)?.name ?? null;
  }

  return { ...appUser, branch_name };
}
