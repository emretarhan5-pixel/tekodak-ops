-- TEKODAK OPS — 014_inventory_rls_staff_write.sql
-- Staff: branch-scoped read/write on inventory tables. Admin policies unchanged.

-- parts (global catalog — staff can create/update, not soft-delete)
DROP POLICY IF EXISTS parts_staff_read ON parts;

DROP POLICY IF EXISTS parts_staff_select ON parts;
CREATE POLICY parts_staff_select ON parts
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS parts_staff_insert ON parts;
CREATE POLICY parts_staff_insert ON parts
FOR INSERT TO authenticated
WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS parts_staff_update ON parts;
CREATE POLICY parts_staff_update ON parts
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND deleted_at IS NULL
)
WITH CHECK (
  public.is_staff_user()
  AND deleted_at IS NULL
);

-- part_branch_stock
DROP POLICY IF EXISTS part_branch_stock_staff_read ON part_branch_stock;

DROP POLICY IF EXISTS part_branch_stock_staff_select ON part_branch_stock;
CREATE POLICY part_branch_stock_staff_select ON part_branch_stock
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS part_branch_stock_staff_insert ON part_branch_stock;
CREATE POLICY part_branch_stock_staff_insert ON part_branch_stock
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS part_branch_stock_staff_update ON part_branch_stock;
CREATE POLICY part_branch_stock_staff_update ON part_branch_stock
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
)
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

-- inventory_movements
DROP POLICY IF EXISTS inventory_movements_staff_read ON inventory_movements;

DROP POLICY IF EXISTS inventory_movements_staff_select ON inventory_movements;
CREATE POLICY inventory_movements_staff_select ON inventory_movements
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS inventory_movements_staff_insert ON inventory_movements;
CREATE POLICY inventory_movements_staff_insert ON inventory_movements
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

-- Kaynak şube personeli, onaylı transferin hedef şubesine transfer_in kaydı ekleyebilir
DROP POLICY IF EXISTS inventory_movements_staff_insert_transfer_target ON inventory_movements;
CREATE POLICY inventory_movements_staff_insert_transfer_target ON inventory_movements
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND movement_type = 'transfer_in'
  AND reference_type = 'inventory_transfer'
  AND reference_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM inventory_transfers t
    WHERE t.id = reference_id
      AND t.source_branch_id = public.user_branch_id()
      AND t.target_branch_id = branch_id
  )
);

-- inventory_transfers
DROP POLICY IF EXISTS inventory_transfers_staff_read ON inventory_transfers;

DROP POLICY IF EXISTS inventory_transfers_staff_select ON inventory_transfers;
CREATE POLICY inventory_transfers_staff_select ON inventory_transfers
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND (
    source_branch_id = public.user_branch_id()
    OR target_branch_id = public.user_branch_id()
  )
);

DROP POLICY IF EXISTS inventory_transfers_staff_insert ON inventory_transfers;
CREATE POLICY inventory_transfers_staff_insert ON inventory_transfers
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND source_branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS inventory_transfers_staff_update ON inventory_transfers;
CREATE POLICY inventory_transfers_staff_update ON inventory_transfers
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND source_branch_id = public.user_branch_id()
)
WITH CHECK (
  public.is_staff_user()
  AND source_branch_id = public.user_branch_id()
);
