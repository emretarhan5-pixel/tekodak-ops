import type { AppUser } from "@/lib/types/user";

export class UsersApiError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "UsersApiError";
  }
}

export type AdminUserContext = {
  user: AppUser;
};

export function toUsersActionError(error: unknown): string {
  if (error instanceof UsersApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu";
}
