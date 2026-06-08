-- TEKODAK OPS — 025_scrap_device.sql
-- Cihaz hek (hurda) işaretleme, admin onay akışı ve bildirim tipleri.
-- Çalıştırma sırası: 024 → 025

-- =============================================================================
-- devices — hek alanları
-- =============================================================================
ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS is_scrapped BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_status TEXT;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_reason TEXT;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_notes TEXT;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrapped_by UUID REFERENCES users(id);

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrapped_at TIMESTAMPTZ;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_approved_by UUID REFERENCES users(id);

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_approved_at TIMESTAMPTZ;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS scrap_rejection_reason TEXT;

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS chk_devices_scrap_status;

ALTER TABLE devices
  ADD CONSTRAINT chk_devices_scrap_status CHECK (
    scrap_status IS NULL
    OR scrap_status IN ('pending_approval', 'approved', 'rejected')
  );

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS chk_devices_scrap_reason;

ALTER TABLE devices
  ADD CONSTRAINT chk_devices_scrap_reason CHECK (
    scrap_reason IS NULL
    OR scrap_reason IN (
      'ekonomik_omur',
      'tamir_maliyeti',
      'fiziksel_hasar',
      'yedek_parca_yok',
      'diger'
    )
  );

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS chk_devices_scrap_coherence;

ALTER TABLE devices
  ADD CONSTRAINT chk_devices_scrap_coherence CHECK (
    (is_scrapped = TRUE AND scrap_status = 'approved')
    OR (
      is_scrapped = FALSE
      AND (scrap_status IS NULL OR scrap_status IN ('pending_approval', 'rejected'))
    )
  );

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS chk_devices_scrap_pending_fields;

ALTER TABLE devices
  ADD CONSTRAINT chk_devices_scrap_pending_fields CHECK (
    scrap_status <> 'pending_approval'
    OR (
      scrap_reason IS NOT NULL
      AND scrap_notes IS NOT NULL
      AND scrapped_by IS NOT NULL
      AND scrapped_at IS NOT NULL
    )
  );

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS chk_devices_scrap_approved_fields;

ALTER TABLE devices
  ADD CONSTRAINT chk_devices_scrap_approved_fields CHECK (
    scrap_status <> 'approved'
    OR (
      scrap_approved_by IS NOT NULL
      AND scrap_approved_at IS NOT NULL
    )
  );

COMMENT ON COLUMN devices.is_scrapped IS
  'Admin onayı sonrası kalıcı hek işareti (onay beklerken false kalır)';
COMMENT ON COLUMN devices.scrap_status IS
  'Hek akış durumu: pending_approval | approved | rejected';
COMMENT ON COLUMN devices.scrap_reason IS
  'Hek nedeni kodu (ekonomik_omur, tamir_maliyeti, …)';
COMMENT ON COLUMN devices.scrap_notes IS
  'Teknisyenin hek açıklaması';
COMMENT ON COLUMN devices.scrapped_by IS
  'Hek talebini oluşturan teknisyen';
COMMENT ON COLUMN devices.scrapped_at IS
  'Hek talebinin oluşturulma zamanı';
COMMENT ON COLUMN devices.scrap_approved_by IS
  'Hek talebini onaylayan admin';
COMMENT ON COLUMN devices.scrap_approved_at IS
  'Hek onay zamanı';
COMMENT ON COLUMN devices.scrap_rejection_reason IS
  'Admin red nedeni (scrap_status = rejected)';

CREATE INDEX IF NOT EXISTS idx_devices_scrap_status
  ON devices(scrap_status)
  WHERE deleted_at IS NULL AND scrap_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devices_is_scrapped
  ON devices(is_scrapped)
  WHERE deleted_at IS NULL AND is_scrapped = TRUE;

-- Mevcut status = scrapped kayıtları yeni alanlarla hizala
UPDATE devices
SET
  is_scrapped = TRUE,
  scrap_status = 'approved',
  scrap_approved_by = COALESCE(updated_by, created_by),
  scrap_approved_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'scrapped'
  AND deleted_at IS NULL
  AND scrap_status IS NULL;

-- =============================================================================
-- notifications — yeni bildirim tipleri (type TEXT; uygulama sabitleri)
-- scrap_approval_requested → admin
-- scrap_approved           → teknisyen
-- scrap_rejected           → teknisyen
-- =============================================================================
COMMENT ON COLUMN notifications.type IS
  'Bildirim tipi. Hek akışı: scrap_approval_requested, scrap_approved, scrap_rejected';

INSERT INTO notification_settings (setting_key, setting_value, description)
VALUES (
  'scrap_approval_notif',
  'true'::jsonb,
  'Hek onay talebi oluşturulduğunda admin bildirimi'
)
ON CONFLICT (setting_key) DO NOTHING;
