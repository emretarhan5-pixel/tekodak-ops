"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { DeleteNotificationButton } from "@/components/notifications/DeleteNotificationButton";
import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  NOTIFICATION_READ_STATUS_LABELS,
  NOTIFICATION_READ_STATUSES,
} from "@/lib/constants/notifications";
import type {
  DeleteNotificationAction,
  MarkAllAsReadAction,
  MarkAsReadAction,
  NotificationsListResult,
} from "@/lib/api/notifications/types";
import type { NotificationSearchInput } from "@/schemas/notifications";
import { cn } from "@/lib/utils";

type NotificationsPageProps = {
  data: NotificationsListResult;
  search: NotificationSearchInput;
  markAsReadAction: MarkAsReadAction;
  markAllAsReadAction: MarkAllAsReadAction;
  deleteNotificationAction: DeleteNotificationAction;
};

export function NotificationsPage({
  data,
  search,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
}: NotificationsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [markingAll, setMarkingAll] = useState(false);

  function setStatus(status: NotificationSearchInput["status"]) {
    const next = new URLSearchParams(urlSearchParams.toString());
    if (status === "all") {
      next.delete("status");
    } else {
      next.set("status", status);
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  async function handleOpen(notification: (typeof data.items)[number]) {
    if (!notification.isRead) {
      const result = await markAsReadAction(notification.id);
      if (!result.success) {
        toast.error(result.error ?? "Okundu işaretlenemedi");
        return;
      }
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      return;
    }

    router.refresh();
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const result = await markAllAsReadAction();
      if (!result.success) {
        toast.error(result.error ?? "İşlem başarısız");
        return;
      }
      toast.success(
        result.data.count > 0
          ? `${result.data.count} bildirim okundu işaretlendi`
          : "Okunmamış bildirim yok",
      );
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bildirimler</h1>
          <p className="mt-1 text-muted-foreground">
            {data.unreadCount > 0
              ? `${data.unreadCount} okunmamış bildirim`
              : "Tüm bildirimler okundu"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2 shrink-0"
          disabled={markingAll || data.unreadCount === 0}
          onClick={handleMarkAllRead}
        >
          {markingAll ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          Tümünü okundu işaretle
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {NOTIFICATION_READ_STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={search.status === status ? "default" : "outline"}
            disabled={isPending}
            onClick={() => setStatus(status)}
          >
            {NOTIFICATION_READ_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      {data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search.status === "unread"
              ? "Okunmamış bildirim yok."
              : search.status === "read"
                ? "Okunmuş bildirim yok."
                : "Henüz bildirim yok."}
          </CardContent>
        </Card>
      ) : (
        <ul className={cn("space-y-3", isPending && "opacity-60")}>
          {data.items.map((notification) => (
            <li key={notification.id}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <NotificationListItem
                    notification={notification}
                    onOpen={handleOpen}
                  />
                </div>
                <DeleteNotificationButton
                  notificationId={notification.id}
                  notificationTitle={notification.title}
                  deleteNotificationAction={deleteNotificationAction}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-primary hover:underline">
          Panele dön
        </Link>
      </p>
    </div>
  );
}
