import type { NotificationReadStatus } from "@/lib/constants/notifications";

export type ActionSuccess<T = void> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResult = {
  items: NotificationItem[];
  unreadCount: number;
};

export type MarkAsReadAction = (id: string) => Promise<ActionResult>;
export type MarkAllAsReadAction = () => Promise<ActionResult<{ count: number }>>;
export type DeleteNotificationAction = (id: string) => Promise<ActionResult>;
