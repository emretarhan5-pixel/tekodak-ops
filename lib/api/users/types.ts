import type { UserRole } from "@/lib/types/user";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type UserListItem = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  branch_name: string | null;
  branch_code: string | null;
  is_active: boolean;
  last_login_at: string | null;
};

export type BranchOption = {
  id: string;
  name: string;
  code: string;
};

export type InviteUserResult = {
  userId: string;
  email: string;
  temporaryPassword: string;
  recoveryLink: string | null;
};

export type DeactivateUserResult = {
  openWorkOrders: number;
};

export type InviteUserAction = (
  input: import("@/schemas/user").InviteUserInput,
) => Promise<ActionResult<InviteUserResult>>;

export type UpdateUserAction = (
  input: import("@/schemas/user").UpdateUserInput,
) => Promise<ActionResult>;

export type DeactivateUserAction = (
  userId: string,
) => Promise<ActionResult<DeactivateUserResult>>;

export type GetOpenWorkOrdersAction = (
  userId: string,
) => Promise<number>;

export type UsersPageData = {
  users: UserListItem[];
  branches: BranchOption[];
};
