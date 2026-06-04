import Link from "next/link";

import { NotificationList } from "@/components/notifications/NotificationList";
import { Card, CardContent } from "@/components/ui/card";
import { getNotifications } from "@/lib/api/notifications/get-notifications";
import { parseNotificationSearchParams } from "@/lib/api/notifications/parse-notification-search-params";
import { deleteNotification } from "@/lib/api/notifications/delete-notification";
import { markAllAsRead } from "@/lib/api/notifications/mark-all-as-read";
import { markAsRead } from "@/lib/api/notifications/mark-as-read";
import { NotificationApiError } from "@/lib/api/notifications/auth.types";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { redirect } from "next/navigation";

type NotificationsRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationsRoutePage({
  searchParams,
}: NotificationsRoutePageProps) {
  const user = await getDashboardUser();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const search = parseNotificationSearchParams(resolvedParams);

  try {
    const data = await getNotifications({
      status: search.status,
      type: search.type,
    });

    return (
      <div className="space-y-6">
        <NotificationList
          data={data}
          search={search}
          markAsReadAction={markAsRead}
          markAllAsReadAction={markAllAsRead}
          deleteNotificationAction={deleteNotification}
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            Panele dön
          </Link>
        </p>
      </div>
    );
  } catch (error) {
    const message =
      error instanceof NotificationApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Bildirimler yüklenirken bir hata oluştu.";

    return (
      <Card className="border-destructive/40">
        <CardContent className="py-10 text-center">
          <h1 className="text-lg font-semibold text-destructive">
            Bildirimler yüklenemedi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
}
