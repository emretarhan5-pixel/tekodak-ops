-- TEKODAK OPS — 027_scrap_next_step.sql
-- Hek sonrası müşteriye öneri (teknisyen notu).
-- Çalıştırma sırası: 026 → 027

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_next_step TEXT;

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS chk_devices_scrap_next_step;

ALTER TABLE devices
  ADD CONSTRAINT chk_devices_scrap_next_step CHECK (
    scrap_next_step IS NULL
    OR scrap_next_step IN (
      'new_machine_sale',
      'second_hand',
      'return_only',
      'customer_decides'
    )
  );

COMMENT ON COLUMN devices.scrap_next_step IS
  'Hek sonrası teknisyen müşteri önerisi (ileride teklif modülüne bağlanacak)';
