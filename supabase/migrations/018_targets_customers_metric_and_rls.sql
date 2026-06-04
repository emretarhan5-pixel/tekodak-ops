-- TEKODAK OPS — 018_targets_customers_metric_and_rls.sql
-- Müşteri hedefi metriği + bireysel atama filtreli progress + staff yazma RLS.

-- =============================================================================
-- 1. metric_type CHECK — customers_new ekle
-- =============================================================================
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_metric_type_check;

ALTER TABLE targets
ADD CONSTRAINT targets_metric_type_check
CHECK (metric_type IN (
  'work_orders_completed',
  'contracts_renewed',
  'contracts_new',
  'response_time',
  'first_time_fix',
  'revenue_contracts',
  'customers_new'
));

-- =============================================================================
-- 2. calculate_target_current_value — customers_new + bireysel atama filtresi
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_target_current_value(target_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  t RECORD;
  assigned_user_id UUID;
  result NUMERIC := 0;
BEGIN
  SELECT *
  INTO t
  FROM targets
  WHERE id = target_uuid;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT it.user_id
  INTO assigned_user_id
  FROM individual_targets it
  WHERE it.target_id = t.id
  ORDER BY it.created_at ASC
  LIMIT 1;

  CASE t.metric_type
    WHEN 'work_orders_completed' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM work_orders wo
      WHERE wo.status = 'completed'
        AND wo.deleted_at IS NULL
        AND wo.work_ended_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR wo.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR wo.assigned_to = assigned_user_id);

    WHEN 'contracts_renewed' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM contracts c
      WHERE c.status = 'renewed'
        AND c.deleted_at IS NULL
        AND c.updated_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR c.responsible_user_id = assigned_user_id);

    WHEN 'contracts_new' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM contracts c
      WHERE c.deleted_at IS NULL
        AND c.created_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR c.created_by = assigned_user_id);

    WHEN 'customers_new' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM customers c
      WHERE c.deleted_at IS NULL
        AND c.created_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR c.created_by = assigned_user_id);

    WHEN 'revenue_contracts' THEN
      SELECT COALESCE(SUM(c.agreed_price), 0)
      INTO result
      FROM contracts c
      WHERE c.deleted_at IS NULL
        AND c.status IN ('active', 'renewed')
        AND c.start_date BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR c.responsible_user_id = assigned_user_id);

    WHEN 'response_time' THEN
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (wo.work_started_at - wo.created_at)) / 3600),
        0
      )
      INTO result
      FROM work_orders wo
      WHERE wo.work_started_at IS NOT NULL
        AND wo.deleted_at IS NULL
        AND wo.created_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR wo.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR wo.assigned_to = assigned_user_id);

    WHEN 'first_time_fix' THEN
      SELECT COALESCE(
        COUNT(*) FILTER (WHERE wo.resolution_status = 'fully_resolved')::NUMERIC
        / NULLIF(COUNT(*) FILTER (WHERE wo.status = 'completed'), 0) * 100,
        0
      )
      INTO result
      FROM work_orders wo
      WHERE wo.status = 'completed'
        AND wo.deleted_at IS NULL
        AND wo.work_ended_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR wo.branch_id = t.branch_id)
        AND (assigned_user_id IS NULL OR wo.assigned_to = assigned_user_id);

    ELSE
      result := 0;
  END CASE;

  RETURN COALESCE(result, 0);
END;
$$;

-- =============================================================================
-- 3. Staff RLS — şube kapsamlı okuma/yazma (silme yalnızca admin)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.target_in_staff_branch(p_target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM targets t
    WHERE t.id = p_target_id
      AND t.branch_id = public.user_branch_id()
  );
$$;

DROP POLICY IF EXISTS targets_staff_read ON targets;

DROP POLICY IF EXISTS targets_staff_select ON targets;
CREATE POLICY targets_staff_select ON targets
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS targets_staff_insert ON targets;
CREATE POLICY targets_staff_insert ON targets
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS targets_staff_update ON targets;
CREATE POLICY targets_staff_update ON targets
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
)
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS individual_targets_staff_read ON individual_targets;

DROP POLICY IF EXISTS individual_targets_staff_select ON individual_targets;
CREATE POLICY individual_targets_staff_select ON individual_targets
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.target_in_staff_branch(target_id)
);

DROP POLICY IF EXISTS individual_targets_staff_insert ON individual_targets;
CREATE POLICY individual_targets_staff_insert ON individual_targets
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.target_in_staff_branch(target_id)
);

DROP POLICY IF EXISTS individual_targets_staff_update ON individual_targets;
CREATE POLICY individual_targets_staff_update ON individual_targets
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.target_in_staff_branch(target_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.target_in_staff_branch(target_id)
);

DROP POLICY IF EXISTS individual_targets_staff_delete ON individual_targets;
CREATE POLICY individual_targets_staff_delete ON individual_targets
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.target_in_staff_branch(target_id)
);
