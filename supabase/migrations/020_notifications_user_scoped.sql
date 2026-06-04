-- TEKODAK OPS — 020_notifications_user_scoped.sql
-- Staff: yalnızca kendi bildirimlerini görür, okundu işaretler ve siler.

DROP POLICY IF EXISTS notifications_staff_read ON notifications;

DROP POLICY IF EXISTS notifications_staff_select ON notifications;
CREATE POLICY notifications_staff_select ON notifications
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS notifications_staff_update ON notifications;
CREATE POLICY notifications_staff_update ON notifications
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND user_id = auth.uid()
)
WITH CHECK (
  public.is_staff_user()
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS notifications_staff_delete ON notifications;
CREATE POLICY notifications_staff_delete ON notifications
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND user_id = auth.uid()
);
