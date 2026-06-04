import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { APP_USER_SELECT, type AppUser } from "@/lib/types/user";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type SupabaseMiddlewareClient = ReturnType<
  typeof createServerClient<Database>
>;

export type MiddlewareSessionResult = {
  supabase: SupabaseMiddlewareClient;
  response: NextResponse;
  user: User | null;
  authError: Error | null;
};

/** Create Supabase client bound to request/response cookies (Edge-safe). */
export function createMiddlewareClient(request: NextRequest): {
  supabase: SupabaseMiddlewareClient;
  response: NextResponse;
} {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response };
}

/**
 * Refresh session cookies and validate JWT via getUser() (not getSession()).
 * Must be called from Next.js middleware on every matched request.
 */
export async function updateSession(
  request: NextRequest,
): Promise<MiddlewareSessionResult> {
  const { supabase, response } = createMiddlewareClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  return {
    supabase,
    response,
    user: user ?? null,
    authError: authError ?? null,
  };
}

/** @deprecated Prefer updateSession — kept for compatibility */
export async function getAuthUser(request: NextRequest) {
  const result = await updateSession(request);
  return {
    user: result.user,
    error: result.authError,
    response: result.response,
    supabase: result.supabase,
  };
}

/** Load profile from public.users (role, branch_id). */
export async function fetchAppUser(
  supabase: SupabaseMiddlewareClient,
  authUserId: string,
): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", authUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AppUser;
}

export function isAppUserActive(user: AppUser | null): boolean {
  return !!user && user.is_active && !user.deleted_at;
}
