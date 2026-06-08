-- TEKODAK OPS — 026_service_request_device_link.sql
-- Servis talebi ↔ cihaz bağlantısı (hek akışı otomatik cihaz kaydı).
-- Çalıştırma sırası: 025 → 026

ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id),
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

COMMENT ON COLUMN service_requests.device_id IS
  'İlişkili cihaz kaydı (hek akışında otomatik oluşturulabilir)';
COMMENT ON COLUMN service_requests.customer_id IS
  'İlişkili müşteri (opsiyonel; cihaz kaydı için kullanılır)';

CREATE INDEX IF NOT EXISTS idx_service_requests_device_id
  ON service_requests(device_id)
  WHERE deleted_at IS NULL AND device_id IS NOT NULL;
