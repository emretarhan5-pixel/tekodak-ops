import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { AppUser } from "@/lib/types/user";

export type NotificationApiContext = {
  supabase: AppSupabaseClient;
  user: AppUser;
};

export class NotificationApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "NotificationApiError";
  }
}
