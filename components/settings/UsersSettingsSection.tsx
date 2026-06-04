import { UsersList } from "@/components/settings/users-list";
import type { SettingsUsersData } from "@/lib/api/settings/types";
import type {
  DeactivateUserAction,
  GetOpenWorkOrdersAction,
  InviteUserAction,
  UpdateUserAction,
} from "@/lib/api/users/types";

type UsersSettingsSectionProps = {
  data: SettingsUsersData;
  currentUserId: string;
  inviteUserAction: InviteUserAction;
  updateUserAction: UpdateUserAction;
  deactivateUserAction: DeactivateUserAction;
  getOpenWorkOrdersAction: GetOpenWorkOrdersAction;
};

export function UsersSettingsSection({
  data,
  currentUserId,
  inviteUserAction,
  updateUserAction,
  deactivateUserAction,
  getOpenWorkOrdersAction,
}: UsersSettingsSectionProps) {
  return (
    <UsersList
      users={data.users}
      branches={data.branches}
      currentUserId={currentUserId}
      inviteUserAction={inviteUserAction}
      updateUserAction={updateUserAction}
      deactivateUserAction={deactivateUserAction}
      getOpenWorkOrdersAction={getOpenWorkOrdersAction}
    />
  );
}
