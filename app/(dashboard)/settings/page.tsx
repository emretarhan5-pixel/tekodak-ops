import { redirect } from "next/navigation";

import { SettingsPage } from "@/components/settings/SettingsPage";
import { Card, CardContent } from "@/components/ui/card";
import { getSettingsPageData } from "@/lib/api/settings/get-settings-page-data";
import { parseSettingsSearchParams } from "@/lib/api/settings/parse-settings-search-params";
import { deactivateBrand } from "@/lib/api/settings/deactivate-brand";
import { deactivateCategory } from "@/lib/api/settings/deactivate-category";
import { deactivateDeviceModel } from "@/lib/api/settings/deactivate-device-model";
import { saveBrand } from "@/lib/api/settings/save-brand";
import { saveCategory } from "@/lib/api/settings/save-category";
import { saveCompanySettings } from "@/lib/api/settings/save-company-settings";
import { saveDeviceModel } from "@/lib/api/settings/save-device-model";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { activateUser } from "@/lib/api/users/activate-user";
import { deactivateUser } from "@/lib/api/users/deactivate-user";
import { deleteUser } from "@/lib/api/users/delete-user";
import { getUserOpenTasks } from "@/lib/api/users/get-user-open-tasks";
import { inviteUser } from "@/lib/api/users/invite-user";
import {
  sendPasswordReset,
  setUserPassword,
} from "@/lib/api/users/reset-user-password";
import { updateUser } from "@/lib/api/users/update-user";
import { getPermissions } from "@/lib/utils/permissions";

type SettingsRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsRoutePage({
  searchParams,
}: SettingsRoutePageProps) {
  const resolvedParams = await searchParams;
  const search = parseSettingsSearchParams(resolvedParams);

  const user = await getDashboardUser();
  if (!user) {
    redirect("/login");
  }

  const permissions = getPermissions(user);
  if (!permissions.canAccessSettings) {
    redirect("/dashboard?error=forbidden");
  }

  try {
    const pageData = await getSettingsPageData(search);

    return (
      <SettingsPage
        pageData={pageData}
        search={search}
        currentUserId={user.id}
        inviteUserAction={inviteUser}
        updateUserAction={updateUser}
        deactivateUserAction={deactivateUser}
        activateUserAction={activateUser}
        deleteUserAction={deleteUser}
        getUserOpenTasksAction={getUserOpenTasks}
        sendPasswordResetAction={sendPasswordReset}
        setUserPasswordAction={setUserPassword}
        saveBrandAction={saveBrand}
        deactivateBrandAction={deactivateBrand}
        saveDeviceModelAction={saveDeviceModel}
        deactivateDeviceModelAction={deactivateDeviceModel}
        saveCategoryAction={saveCategory}
        deactivateCategoryAction={deactivateCategory}
        saveCompanySettingsAction={saveCompanySettings}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ayarlar yüklenirken bir hata oluştu.";

    return (
      <Card className="border-destructive/40">
        <CardContent className="py-10 text-center">
          <h1 className="text-lg font-semibold text-destructive">
            Ayarlar yüklenemedi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
}
