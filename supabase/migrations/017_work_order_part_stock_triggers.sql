-- TEKODAK OPS — 017_work_order_part_stock_triggers.sql
-- İş emri parça ekleme/silme: stok hareketleri RLS bypass + iade.

CREATE OR REPLACE FUNCTION reduce_stock_on_part_use()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wo_branch_id UUID;
  movement_id UUID;
  current_qty NUMERIC;
BEGIN
  SELECT branch_id
  INTO wo_branch_id
  FROM work_orders
  WHERE id = NEW.work_order_id;

  IF wo_branch_id IS NULL THEN
    RAISE EXCEPTION 'work_order % not found for stock reduction', NEW.work_order_id;
  END IF;

  SELECT COALESCE(current_quantity, 0)
  INTO current_qty
  FROM current_stock
  WHERE part_id = NEW.part_id
    AND branch_id = wo_branch_id;

  IF current_qty < NEW.quantity THEN
    RAISE EXCEPTION 'Yetersiz stok. Mevcut: %, istenen: %', current_qty, NEW.quantity;
  END IF;

  INSERT INTO inventory_movements (
    part_id,
    branch_id,
    movement_type,
    quantity_change,
    reference_type,
    reference_id,
    reason,
    created_by
  ) VALUES (
    NEW.part_id,
    wo_branch_id,
    'work_order_usage',
    -NEW.quantity,
    'work_order',
    NEW.work_order_id,
    'İş emri kullanımı',
    NEW.added_by
  )
  RETURNING id INTO movement_id;

  NEW.inventory_movement_id := movement_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION restore_stock_on_part_remove()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wo_branch_id UUID;
BEGIN
  SELECT branch_id
  INTO wo_branch_id
  FROM work_orders
  WHERE id = OLD.work_order_id;

  IF wo_branch_id IS NULL THEN
    RAISE EXCEPTION 'work_order % not found for stock restore', OLD.work_order_id;
  END IF;

  INSERT INTO inventory_movements (
    part_id,
    branch_id,
    movement_type,
    quantity_change,
    reference_type,
    reference_id,
    reason,
    created_by
  ) VALUES (
    OLD.part_id,
    wo_branch_id,
    'return',
    OLD.quantity,
    'work_order',
    OLD.work_order_id,
    'İş emri parça iadesi',
    auth.uid()
  );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_stock_on_part_remove ON work_order_parts;
CREATE TRIGGER trg_restore_stock_on_part_remove
  BEFORE DELETE ON work_order_parts
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_part_remove();

DROP POLICY IF EXISTS work_order_parts_staff_delete ON work_order_parts;
CREATE POLICY work_order_parts_staff_delete ON work_order_parts
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.work_order_in_staff_branch(work_order_id)
);
