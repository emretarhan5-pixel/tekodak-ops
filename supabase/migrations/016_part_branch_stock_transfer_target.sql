-- TEKODAK OPS — 016_part_branch_stock_transfer_target.sql
-- Transfer: kaynak şube personeli hedef şubede ürün tanımını okuyup oluşturabilsin.

-- Aynı parça kaynak şubede tanımlıysa diğer şubelerdeki stok kayıtlarını görebilir
DROP POLICY IF EXISTS part_branch_stock_staff_select_transfer ON part_branch_stock;
CREATE POLICY part_branch_stock_staff_select_transfer ON part_branch_stock
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND EXISTS (
    SELECT 1
    FROM part_branch_stock source_pbs
    WHERE source_pbs.part_id = part_branch_stock.part_id
      AND source_pbs.branch_id = public.user_branch_id()
  )
);

-- Hedef şubede kayıt yoksa transfer öncesi otomatik tanım oluşturabilir
DROP POLICY IF EXISTS part_branch_stock_staff_insert_transfer_target ON part_branch_stock;
CREATE POLICY part_branch_stock_staff_insert_transfer_target ON part_branch_stock
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id <> public.user_branch_id()
  AND EXISTS (
    SELECT 1
    FROM part_branch_stock source_pbs
    WHERE source_pbs.part_id = part_id
      AND source_pbs.branch_id = public.user_branch_id()
  )
);
