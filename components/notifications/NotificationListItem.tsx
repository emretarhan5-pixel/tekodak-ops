"use client";

import { Trash2 } from "lucide-react";

import { NotificationTypeIcon } from "@/components/notifications/notification-type-icon";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/lib/api/notifications/types";
import { RelativeTime } from "@/components/ui/relative-time";
import { cn } from "@/lib/utils";

type NotificationListItemProps = {
  notification: NotificationItem;
  compact?: boolean;
  onOpen?: (notification: NotificationItem) => void;
  onDelete?: (notification: NotificationItem) => void;
  showDelete?: boolean;
};

export function NotificationListItem({
  notification,
  compact = false,
  onOpen,
  onDelete,
  showDelete = false,
}: NotificationListItemProps) {
  const content = (
    <>
      <NotificationTypeIcon type={notification.type} />
      <div className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            "truncate text-sm",
            !notification.isRead && "font-semibold",
          )}
        >
          {notification.title}
        </p>
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "line-clamp-2 text-xs" : "line-clamp-2 text-sm",
          )}
        >
          {notification.message}
        </p>
        <RelativeTime
          date={notification.createdAt}
          className="mt-0.5 block text-xs text-muted-foreground"
        />
      </div>
      {!notification.isRead ? (
        <span
          className="mt-1 size-2 shrink-0 rounded-full bg-primary"
          aria-hidden
        />
      ) : null}
    </>
  );

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    void onOpen?.(notification);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent",
          !notification.isRead && "bg-accent/40",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-border p-3",
        !notification.isRead && "border-primary/30 bg-accent/30",
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-0 flex-1 gap-3 text-left"
      >
        {content}
      </button>
      {showDelete && onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Bildirimi sil"
          onClick={() => onDelete(notification)}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
