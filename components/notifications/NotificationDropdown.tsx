"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDropdownNotifications } from "@/lib/api/notifications/get-notifications";
import { markAllAsRead } from "@/lib/api/notifications/mark-all-as-read";
import { markAsRead } from "@/lib/api/notifications/mark-as-read";
import type { NotificationItem } from "@/lib/api/notifications/types";

type NotificationDropdownProps = {
  initialUnreadCount: number;
};

export function NotificationDropdown({
  initialUnreadCount,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  const loadDropdown = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDropdownNotifications();
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      toast.error("Bildirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadDropdown();
    }
  }

  async function handleNotificationClick(notification: NotificationItem) {
    setOpen(false);

    if (!notification.isRead) {
      const result = await markAsRead(notification.id);
      if (!result.success) {
        toast.error(result.error ?? "Okundu işaretlenemedi");
        return;
      }

      setUnreadCount((count) => Math.max(0, count - 1));
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        ),
      );
    }

    router.refresh();

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const result = await markAllAsRead();
      if (!result.success) {
        toast.error(result.error ?? "İşlem başarısız");
        return;
      }
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      toast.success("Tüm bildirimler okundu işaretlendi");
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Bildirimler"
            data-onboarding-target="notifications"
          />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <Badge
            variant="default"
            className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full border-0 bg-destructive px-1 text-[10px] font-medium text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 gap-0 p-0"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-semibold">Bildirimler</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={markingAll || unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            {markingAll ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCheck className="size-3" />
            )}
            Tümünü okundu işaretle
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto px-1 py-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Bildirim yok
            </p>
          ) : (
            items.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                compact
                onOpen={handleNotificationClick}
              />
            ))
          )}
        </div>

        <div className="border-t border-border p-3">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full",
            })}
          >
            Tüm bildirimleri gör →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
