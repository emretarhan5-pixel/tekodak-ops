"use client";

import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

type NotificationBellProps = {
  initialUnreadCount: number;
};

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  return <NotificationDropdown initialUnreadCount={initialUnreadCount} />;
}
