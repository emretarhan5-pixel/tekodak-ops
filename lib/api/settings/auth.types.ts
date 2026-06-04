import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { AppUser } from "@/lib/types/user";
import type { Permissions } from "@/lib/utils/permissions";

export type SettingsApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
  permissions: Permissions;
};

export class SettingsApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" =
      "FORBIDDEN",
  ) {
    super(message);
    this.name = "SettingsApiError";
  }
}
