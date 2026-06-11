"use client";

import { UsersList } from "@/components/settings/users-list";
import type { SettingsUsersData } from "@/lib/api/settings/types";
import type {
  ActivateUserAction,
  DeactivateUserAction,
  DeleteUserAction,
  GetUserOpenTasksAction,
  UpdateUserAction,
} from "@/lib/api/users/types";

type UsersSettingsSectionProps = {
  data: SettingsUsersData;
  currentUserId: string;
  onInviteClick: () => void;
  updateUserAction: UpdateUserAction;
  deactivateUserAction: DeactivateUserAction;
  activateUserAction: ActivateUserAction;
  deleteUserAction: DeleteUserAction;
  getUserOpenTasksAction: GetUserOpenTasksAction;
};

export function UsersSettingsSection({
  data,
  currentUserId,
  onInviteClick,
  updateUserAction,
  deactivateUserAction,
  activateUserAction,
  deleteUserAction,
  getUserOpenTasksAction,
}: UsersSettingsSectionProps) {
  return (
    <UsersList
      users={data.users}
      branches={data.branches}
      currentUserId={currentUserId}
      onInviteClick={onInviteClick}
      updateUserAction={updateUserAction}
      deactivateUserAction={deactivateUserAction}
      activateUserAction={activateUserAction}
      deleteUserAction={deleteUserAction}
      getUserOpenTasksAction={getUserOpenTasksAction}
    />
  );
}
