-- TEKODAK OPS — 004_functions.sql
-- Helper / reporting functions + views (NO triggers — see 003_triggers.sql)
--
-- NOT in this file (defined in 003):
--   generate_contract_number, generate_work_order_number,
--   update_updated_at, update_updated_at_with_by, log_to_audit,
--   work_order_timer_logic, reduce_stock_on_part_use,
--   calculate_warranty_end, mark_old_contract_renewed

-- =============================================================================
-- calculate_target_current_value
-- Column refs: targets, work_orders, contracts (001_initial_schema.sql)
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_target_current_value(target_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  t RECORD;
  result NUMERIC := 0;
BEGIN
  SELECT *
  INTO t
  FROM targets
  WHERE id = target_uuid;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  CASE t.metric_type
    WHEN 'work_orders_completed' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM work_orders wo
      WHERE wo.status = 'completed'
        AND wo.deleted_at IS NULL
        AND wo.work_ended_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR wo.branch_id = t.branch_id);

    WHEN 'contracts_renewed' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM contracts c
      WHERE c.status = 'renewed'
        AND c.deleted_at IS NULL
        AND c.updated_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id);

    WHEN 'contracts_new' THEN
      SELECT COUNT(*)::NUMERIC
      INTO result
      FROM contracts c
      WHERE c.deleted_at IS NULL
        AND c.created_at::DATE BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id);

    WHEN 'revenue_contracts' THEN
      SELECT COALESCE(SUM(c.agreed_price), 0)
      INTO result
      FROM contracts c
      WHERE c.deleted_at IS NULL
        AND c.status IN ('active', 'renewed')
        AND c.start_date BETWEEN t.start_date AND t.end_date
        AND (t.branch_id IS NULL OR c.branch_id = t.branch_id);

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
        AND (t.branch_id IS NULL OR wo.branch_id = t.branch_id);

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
        AND (t.branch_id IS NULL OR wo.branch_id = t.branch_id);

    ELSE
      result := 0;
  END CASE;

  RETURN COALESCE(result, 0);
END;
$$;

-- =============================================================================
-- target_progress view (spec 02-DATA-MODEL.md §5.5)
-- LATERAL: call calculate_target_current_value once per row
-- =============================================================================
DROP VIEW IF EXISTS target_progress;

CREATE VIEW target_progress AS
SELECT
  t.id AS target_id,
  t.name,
  t.metric_type,
  t.target_value,
  t.start_date,
  t.end_date,
  t.branch_id,
  cv.current_value,
  ROUND((cv.current_value / NULLIF(t.target_value, 0) * 100)::NUMERIC, 1) AS completion_percentage,
  GREATEST(t.end_date - CURRENT_DATE, 0) AS days_remaining,
  CASE
    WHEN CURRENT_DATE > t.end_date THEN 'finished'
    WHEN cv.current_value >= t.target_value THEN 'achieved'
    WHEN (t.end_date - CURRENT_DATE) <= 7
      AND (cv.current_value / NULLIF(t.target_value, 0) * 100) < 90
      THEN 'at_risk'
    ELSE 'on_track'
  END AS progress_status
FROM targets t
CROSS JOIN LATERAL (
  SELECT calculate_target_current_value(t.id) AS current_value
) cv
WHERE t.status = 'active';

-- =============================================================================
-- refresh_current_stock (cron / manual matview refresh)
-- Requires UNIQUE INDEX on current_stock (001: idx_current_stock_part_branch_unique)
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_current_stock()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY current_stock;
END;
$$;
