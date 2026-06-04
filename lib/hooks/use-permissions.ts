"use client";

import { getPermissions, type Permissions } from "@/lib/utils/permissions";

import { useCurrentUser } from "./use-current-user";

export function usePermissions(): Permissions & {
  isLoading: boolean;
  user: ReturnType<typeof useCurrentUser>["data"];
} {
  const { data: user, isLoading } = useCurrentUser();
  const permissions = getPermissions(user);

  return {
    ...permissions,
    isLoading,
    user,
  };
}
