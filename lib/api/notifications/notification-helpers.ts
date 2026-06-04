import { NotificationApiError } from "@/lib/api/notifications/auth.types";

export const NOTIFICATIONS_REVALIDATE_PATH = "/notifications";

export function toNotificationError(error: unknown): string {
  if (error instanceof NotificationApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Bildirim işlemi başarısız oldu.";
}

export function mapNotificationRow(row: {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  priority: string | null;
  is_read: boolean | null;
  read_at: string | null;
  created_at: string | null;
}) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actionUrl: row.action_url,
    priority: row.priority ?? "normal",
    isRead: row.is_read === true,
    readAt: row.read_at,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}
