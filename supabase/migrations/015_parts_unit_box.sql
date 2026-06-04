-- TEKODAK OPS — 015_parts_unit_box.sql
-- parts.unit CHECK: add 'box' (Kutu) for stock form

ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_unit_check;

ALTER TABLE parts
  ADD CONSTRAINT parts_unit_check CHECK (unit IN (
    'piece', 'liter', 'meter', 'kg', 'package', 'box'
  ));
