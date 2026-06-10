"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { OnboardingRestartButton } from "@/components/onboarding/OnboardingRestartButton";
import { DeleteNotificationButton } from "@/components/notifications/DeleteNotificationButton";
import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NOTIFICATION_READ_STATUS_LABELS,
  NOTIFICATION_READ_STATUSES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
} from "@/lib/constants/notifications";
import type {
  DeleteNotificationAction,
  MarkAllAsReadAction,
  MarkAsReadAction,
  NotificationsListResult,
} from "@/lib/api/notifications/types";
import type { NotificationSearchInput } from "@/schemas/notifications";
import { cn } from "@/lib/utils";

type NotificationListProps = {
  data: NotificationsListResult;
  search: NotificationSearchInput;
  markAsReadAction: MarkAsReadAction;
  markAllAsReadAction: MarkAllAsReadAction;
  deleteNotificationAction: DeleteNotificationAction;
};

export function NotificationList({
  data,
  search,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
}: NotificationListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [markingAll, setMarkingAll] = useState(false);

  function updateSearch(updates: Partial<NotificationSearchInput>) {
    const next = new URLSearchParams(urlSearchParams?.toString() ?? "");

    if (updates.status !== undefined) {
      if (updates.status === "all") {
        next.delete("status");
      } else {
        next.set("status", updates.status);
      }
    }

    if (updates.type !== undefined) {
      if (updates.type === "all") {
        next.delete("type");
      } else {
        next.set("type", updates.type);
      }
    }

    startTransition(() => {
      router.push(`${pathname ?? "/"}?${next.toString()}`);
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

    router.refresh();

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
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
      <div className="group relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bildirimler</h1>
          <p className="mt-1 text-muted-foreground">
            {data.unreadCount > 0
              ? `${data.unreadCount} okunmamış bildirim`
              : "Tüm bildirimler okundu"}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2"
          data-onboarding-target="notif-tour-mark-all"
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
        <OnboardingRestartButton />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {NOTIFICATION_READ_STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={search.status === status ? "default" : "outline"}
              disabled={isPending}
              onClick={() => updateSearch({ status })}
            >
              {NOTIFICATION_READ_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>

        <Select
          value={search.type}
          disabled={isPending}
          onValueChange={(value) => {
            if (!value) return;
            updateSearch({
              type: value as NotificationSearchInput["type"],
            });
          }}
        >
          <SelectTrigger className="w-40" size="sm">
            <SelectValue placeholder="Tüm tipler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm tipler</SelectItem>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {NOTIFICATION_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.items.length === 0 ? (
        <Card data-onboarding-target="notif-tour-list">
          <CardContent
            className="py-12 text-center text-muted-foreground"
            data-onboarding-target="notif-tour-first-item"
          >
            {search.status === "unread"
              ? "Okunmamış bildirim yok."
              : search.status === "read"
                ? "Okunmuş bildirim yok."
                : search.type !== "all"
                  ? "Bu tipte bildirim yok."
                  : "Henüz bildirim yok."}
          </CardContent>
        </Card>
      ) : (
        <ul
          className={cn("space-y-3", isPending && "opacity-60")}
          data-onboarding-target="notif-tour-list"
        >
          {data.items.map((notification, index) => (
            <li key={notification.id}>
              <div
                className="flex items-start gap-2"
                {...(index === 0
                  ? { "data-onboarding-target": "notif-tour-first-item" }
                  : {})}
              >
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
    </div>
  );
}
