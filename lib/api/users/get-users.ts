"use server";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import type {
  BranchOption,
  UserListItem,
  UsersPageData,
} from "@/lib/api/users/types";
import { createClient } from "@/lib/supabase/server";

const USER_LIST_SELECT = `
  id,
  email,
  full_name,
  role,
  branch_id,
  is_active,
  last_login_at,
  deleted_at,
  branches (
    name,
    code
  )
`;

type RawUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserListItem["role"];
  branch_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
  branches: { name: string; code: string } | null;
};

export async function getUsersPageData(): Promise<UsersPageData> {
  try {
    await getAdminUserContext();
    const supabase = await createClient();

    const [usersResult, branchesResult] = await Promise.all([
      supabase
        .from("users")
        .select(USER_LIST_SELECT)
        .is("deleted_at", null)
        .order("full_name"),
      supabase
        .from("branches")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (usersResult.error) {
      throw new Error(usersResult.error.message);
    }
    if (branchesResult.error) {
      throw new Error(branchesResult.error.message);
    }

    const users = ((usersResult.data ?? []) as unknown as RawUserRow[]).map(
      (row): UserListItem => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        branch_id: row.branch_id,
        branch_name: row.branches?.name ?? null,
        branch_code: row.branches?.code ?? null,
        is_active: row.is_active,
        last_login_at: row.last_login_at,
      }),
    );

    return {
      users,
      branches: (branchesResult.data ?? []) as BranchOption[],
    };
  } catch (error) {
    if (error instanceof UsersApiError) {
      throw error;
    }
    throw new Error(toUsersActionError(error));
  }
}
