-- TEKODAK OPS — 003_triggers.sql
-- Source: docs/spec/02-DATA-MODEL.md (trigger section)
-- Column refs verified against 001_initial_schema.sql

-- =============================================================================
-- 1. generate_contract_number
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(contract_number FROM 'SZ-' || year_str || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM contracts
    WHERE contract_number LIKE 'SZ-' || year_str || '-%';

    NEW.contract_number := 'SZ-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 2. generate_work_order_number
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(work_order_number FROM 'İE-' || year_str || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM work_orders
    WHERE work_order_number LIKE 'İE-' || year_str || '-%';

    NEW.work_order_number := 'İE-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. update_updated_at (tables with updated_at only — no updated_by column)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Tables with updated_at AND updated_by
CREATE OR REPLACE FUNCTION update_updated_at_with_by()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 4. log_to_audit
-- =============================================================================
CREATE OR REPLACE FUNCTION log_to_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  action_type TEXT;
  description_text TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    description_text := TG_TABLE_NAME || ' kaydı oluşturuldu';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    description_text := TG_TABLE_NAME || ' kaydı güncellendi';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    description_text := TG_TABLE_NAME || ' kaydı silindi';
  END IF;

  INSERT INTO audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    description
  ) VALUES (
    auth.uid(),
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    description_text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =============================================================================
-- 5. work_order_timer_logic
-- =============================================================================
CREATE OR REPLACE FUNCTION work_order_timer_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'assigned' AND NEW.status = 'in_progress' THEN
    NEW.work_started_at := NOW();
  END IF;

  IF OLD.status = 'in_progress' AND NEW.status = 'on_hold' THEN
    NEW.hold_started_at := NOW();
  END IF;

  IF OLD.status = 'on_hold' AND NEW.status = 'in_progress' THEN
    NEW.total_paused_seconds := COALESCE(OLD.total_paused_seconds, 0)
      + EXTRACT(EPOCH FROM (NOW() - OLD.hold_started_at))::INTEGER;
    NEW.hold_started_at := NULL;
  END IF;

  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.work_ended_at := NOW();
    IF NEW.work_started_at IS NOT NULL THEN
      NEW.actual_duration_hours :=
        (EXTRACT(EPOCH FROM (NEW.work_ended_at - NEW.work_started_at))
          - COALESCE(NEW.total_paused_seconds, 0)) / 3600;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 6. reduce_stock_on_part_use (branch_id from work_orders — not from parts)
-- =============================================================================
CREATE OR REPLACE FUNCTION reduce_stock_on_part_use()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  wo_branch_id UUID;
  movement_id UUID;
BEGIN
  SELECT branch_id
  INTO wo_branch_id
  FROM work_orders
  WHERE id = NEW.work_order_id;

  IF wo_branch_id IS NULL THEN
    RAISE EXCEPTION 'work_order % not found for stock reduction', NEW.work_order_id;
  END IF;

  INSERT INTO inventory_movements (
    part_id,
    branch_id,
    movement_type,
    quantity_change,
    reference_type,
    reference_id,
    created_by
  ) VALUES (
    NEW.part_id,
    wo_branch_id,
    'work_order_usage',
    -NEW.quantity,
    'work_order',
    NEW.work_order_id,
    NEW.added_by
  )
  RETURNING id INTO movement_id;

  NEW.inventory_movement_id := movement_id;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 7. calculate_warranty_end
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_warranty_end()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  warranty_years INTEGER;
BEGIN
  IF NEW.warranty_start_date IS NOT NULL AND NEW.warranty_end_date IS NULL THEN
    SELECT COALESCE(dm.warranty_years, b.default_warranty_years, 2)
    INTO warranty_years
    FROM device_models dm
    JOIN brands b ON b.id = dm.brand_id
    WHERE dm.id = NEW.model_id;

    NEW.warranty_end_date :=
      NEW.warranty_start_date + (warranty_years || ' years')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 8. mark_old_contract_renewed
-- =============================================================================
CREATE OR REPLACE FUNCTION mark_old_contract_renewed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.renewed_from_id IS NOT NULL THEN
    UPDATE contracts
    SET
      status = 'renewed',
      renewed_to_id = NEW.id,
      updated_at = NOW()
    WHERE id = NEW.renewed_from_id;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- DROP existing triggers (idempotent re-run)
-- =============================================================================
DROP TRIGGER IF EXISTS trg_generate_contract_number ON contracts;
DROP TRIGGER IF EXISTS trg_generate_work_order_number ON work_orders;
DROP TRIGGER IF EXISTS trg_work_order_timer ON work_orders;
DROP TRIGGER IF EXISTS trg_reduce_stock_on_part_use ON work_order_parts;
DROP TRIGGER IF EXISTS trg_calculate_warranty ON devices;
DROP TRIGGER IF EXISTS trg_mark_old_contract_renewed ON contracts;

DROP TRIGGER IF EXISTS trg_update_timestamp_branches ON branches;
DROP TRIGGER IF EXISTS trg_update_timestamp_brands ON brands;
DROP TRIGGER IF EXISTS trg_update_timestamp_categories ON categories;
DROP TRIGGER IF EXISTS trg_update_timestamp_users ON users;
DROP TRIGGER IF EXISTS trg_update_timestamp_customers ON customers;
DROP TRIGGER IF EXISTS trg_update_timestamp_devices ON devices;
DROP TRIGGER IF EXISTS trg_update_timestamp_contracts ON contracts;
DROP TRIGGER IF EXISTS trg_update_timestamp_work_orders ON work_orders;
DROP TRIGGER IF EXISTS trg_update_timestamp_parts ON parts;
DROP TRIGGER IF EXISTS trg_update_timestamp_targets ON targets;
DROP TRIGGER IF EXISTS trg_update_timestamp_announcements ON announcements;
DROP TRIGGER IF EXISTS trg_update_timestamp_system_settings ON system_settings;
DROP TRIGGER IF EXISTS trg_update_timestamp_notification_settings ON notification_settings;
DROP TRIGGER IF EXISTS trg_update_timestamp_part_branch_stock ON part_branch_stock;
DROP TRIGGER IF EXISTS trg_update_timestamp_pricing_rules ON pricing_rules;

DROP TRIGGER IF EXISTS trg_audit_customers ON customers;
DROP TRIGGER IF EXISTS trg_audit_devices ON devices;
DROP TRIGGER IF EXISTS trg_audit_contracts ON contracts;
DROP TRIGGER IF EXISTS trg_audit_work_orders ON work_orders;
DROP TRIGGER IF EXISTS trg_audit_parts ON parts;
DROP TRIGGER IF EXISTS trg_audit_users ON users;

-- =============================================================================
-- CREATE triggers
-- =============================================================================

-- 1 & 8: contracts
CREATE TRIGGER trg_generate_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_number();

CREATE TRIGGER trg_mark_old_contract_renewed
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION mark_old_contract_renewed();

-- 2 & 5: work_orders
CREATE TRIGGER trg_generate_work_order_number
  BEFORE INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_work_order_number();

CREATE TRIGGER trg_work_order_timer
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION work_order_timer_logic();

-- 6: work_order_parts
CREATE TRIGGER trg_reduce_stock_on_part_use
  BEFORE INSERT ON work_order_parts
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_part_use();

-- 7: devices
CREATE TRIGGER trg_calculate_warranty
  BEFORE INSERT ON devices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_warranty_end();

-- 3: updated_at — tables WITHOUT updated_by
CREATE TRIGGER trg_update_timestamp_branches
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_brands
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_targets
  BEFORE UPDATE ON targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_announcements
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_part_branch_stock
  BEFORE UPDATE ON part_branch_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_pricing_rules
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 3: updated_at + updated_by
CREATE TRIGGER trg_update_timestamp_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_devices
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_contracts
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_work_orders
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_parts
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_system_settings
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

CREATE TRIGGER trg_update_timestamp_notification_settings
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_with_by();

-- 4: audit_log on critical tables
CREATE TRIGGER trg_audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION log_to_audit();

CREATE TRIGGER trg_audit_devices
  AFTER INSERT OR UPDATE OR DELETE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION log_to_audit();

CREATE TRIGGER trg_audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_to_audit();

CREATE TRIGGER trg_audit_work_orders
  AFTER INSERT OR UPDATE OR DELETE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_to_audit();

CREATE TRIGGER trg_audit_parts
  AFTER INSERT OR UPDATE OR DELETE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION log_to_audit();

CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_to_audit();
