"use client";

import { UsersList } from "@/components/settings/users-list";
import type { SettingsUsersData } from "@/lib/api/settings/types";
import type {
  DeactivateUserAction,
  GetOpenWorkOrdersAction,
  UpdateUserAction,
} from "@/lib/api/users/types";

type UsersSettingsSectionProps = {
  data: SettingsUsersData;
  currentUserId: string;
  onInviteClick: () => void;
  updateUserAction: UpdateUserAction;
  deactivateUserAction: DeactivateUserAction;
  getOpenWorkOrdersAction: GetOpenWorkOrdersAction;
};

export function UsersSettingsSection({
  data,
  currentUserId,
  onInviteClick,
  updateUserAction,
  deactivateUserAction,
  getOpenWorkOrdersAction,
}: UsersSettingsSectionProps) {
  return (
    <UsersList
      users={data.users}
      branches={data.branches}
      currentUserId={currentUserId}
      onInviteClick={onInviteClick}
      updateUserAction={updateUserAction}
      deactivateUserAction={deactivateUserAction}
      getOpenWorkOrdersAction={getOpenWorkOrdersAction}
    />
  );
}
