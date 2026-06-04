import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type { Database };

export async function createClient(): Promise<AppSupabaseClient> {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll from a Server Component — session refresh handled in middleware
          }
        },
      },
    },
  );

  return client as unknown as AppSupabaseClient;
}
