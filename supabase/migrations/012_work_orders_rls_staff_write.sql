-- TEKODAK OPS — 012_work_orders_rls_staff_write.sql
-- Staff: branch-scoped read/write on work order tables. Admin policies unchanged.

CREATE OR REPLACE FUNCTION public.work_order_in_staff_branch(p_work_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM work_orders wo
    WHERE wo.id = p_work_order_id
      AND wo.deleted_at IS NULL
      AND wo.branch_id = public.user_branch_id()
  );
$$;

-- work_orders
DROP POLICY IF EXISTS work_orders_staff_read ON work_orders;

DROP POLICY IF EXISTS work_orders_staff_select ON work_orders;
CREATE POLICY work_orders_staff_select ON work_orders
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS work_orders_staff_insert ON work_orders;
CREATE POLICY work_orders_staff_insert ON work_orders
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS work_orders_staff_update ON work_orders;
CREATE POLICY work_orders_staff_update ON work_orders
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND deleted_at IS NULL
)
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

-- work_order_activities
DROP POLICY IF EXISTS work_order_activities_staff_read ON work_order_activities;

DROP POLICY IF EXISTS work_order_activities_staff_select ON work_order_activities;
CREATE POLICY work_order_activities_staff_select ON work_order_activities
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

DROP POLICY IF EXISTS work_order_activities_staff_insert ON work_order_activities;
CREATE POLICY work_order_activities_staff_insert ON work_order_activities
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

-- work_order_parts
DROP POLICY IF EXISTS work_order_parts_staff_read ON work_order_parts;

DROP POLICY IF EXISTS work_order_parts_staff_select ON work_order_parts;
CREATE POLICY work_order_parts_staff_select ON work_order_parts
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

DROP POLICY IF EXISTS work_order_parts_staff_insert ON work_order_parts;
CREATE POLICY work_order_parts_staff_insert ON work_order_parts
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

-- work_order_photos
DROP POLICY IF EXISTS work_order_photos_staff_read ON work_order_photos;

DROP POLICY IF EXISTS work_order_photos_staff_select ON work_order_photos;
CREATE POLICY work_order_photos_staff_select ON work_order_photos
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

DROP POLICY IF EXISTS work_order_photos_staff_insert ON work_order_photos;
CREATE POLICY work_order_photos_staff_insert ON work_order_photos
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

-- work_order_files
DROP POLICY IF EXISTS work_order_files_staff_read ON work_order_files;

DROP POLICY IF EXISTS work_order_files_staff_select ON work_order_files;
CREATE POLICY work_order_files_staff_select ON work_order_files
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND deleted_at IS NULL
  AND public.work_order_in_staff_branch(work_order_id)
);

DROP POLICY IF EXISTS work_order_files_staff_insert ON work_order_files;
CREATE POLICY work_order_files_staff_insert ON work_order_files
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);

DROP POLICY IF EXISTS work_order_files_staff_update ON work_order_files;
CREATE POLICY work_order_files_staff_update ON work_order_files
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);
