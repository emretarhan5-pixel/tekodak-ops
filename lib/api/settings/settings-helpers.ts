import type { SettingsApiContext } from "@/lib/api/settings/auth.types";
import { SettingsApiError } from "@/lib/api/settings/auth.types";

export function assertSettingsAdmin(ctx: SettingsApiContext): void {
  if (!ctx.permissions.canAccessSettings) {
    throw new SettingsApiError("Bu işlem yalnızca yöneticiler içindir", "FORBIDDEN");
  }
}

export function toSettingsError(error: unknown): string {
  if (error instanceof SettingsApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}

export const SETTINGS_REVALIDATE_PATH = "/settings";
