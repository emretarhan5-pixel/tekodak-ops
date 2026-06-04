import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/** Typed Supabase client (use after casting from SSR createClient). */
export type AppSupabaseClient = SupabaseClient<Database>;
