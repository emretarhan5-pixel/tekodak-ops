-- TEKODAK OPS — 022_service_requests.sql
-- Servis talebi modülü: tablolar, numara üretimi, stok trigger, RLS.
-- Çalıştırma sırası: 022 → ardından 023 (storage). Bucket'ı önce veya sonra oluşturabilirsiniz.

-- =============================================================================
-- inventory_movements: yeni movement_type
-- =============================================================================
ALTER TABLE inventory_movements
  DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check;

ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_movement_type_check
  CHECK (movement_type IN (
    'stock_in',
    'work_order_usage',
    'service_request_usage',
    'manual_out',
    'transfer_out',
    'transfer_in',
    'adjustment',
    'return'
  ));

-- =============================================================================
-- service_requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_requests (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number              TEXT UNIQUE NOT NULL,
  branch_id                   UUID NOT NULL REFERENCES branches(id),
  status                      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'ariza_tespit',
    'teklif_hazir',
    'teklif_onaylandi',
    'bakim_yapiliyor',
    'tamamlandi',
    'rejected'
  )),
  current_step                SMALLINT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),

  -- Adım 1 — Kayıt
  company_name                TEXT NOT NULL,
  contact_name                TEXT NOT NULL,
  phone                       TEXT NOT NULL,
  address                     TEXT NOT NULL,
  device_type                 TEXT NOT NULL,
  brand_model                 TEXT NOT NULL,
  device_model_id             UUID REFERENCES device_models(id),
  serial_number               TEXT NOT NULL,
  under_warranty              BOOLEAN NOT NULL DEFAULT FALSE,
  reported_fault              TEXT NOT NULL,
  assigned_technician_id      UUID NOT NULL REFERENCES users(id),

  -- Adım 2 — Arıza tespit
  diagnosed_fault             TEXT,
  customer_statement          TEXT,
  technical_inspection_result TEXT,
  wrong_usage_detected        BOOLEAN NOT NULL DEFAULT FALSE,

  -- Adım 3 — Teklif
  labor_cost                  NUMERIC(12, 2),
  shipping_cost               NUMERIC(12, 2),
  vat_option                  TEXT CHECK (vat_option IS NULL OR vat_option IN (
    'vat_20', 'vat_10', 'vat_1', 'vat_included', 'no_vat'
  )),
  quote_subtotal              NUMERIC(12, 2),
  quote_total                 NUMERIC(12, 2),
  quote_sent_to_customer      BOOLEAN NOT NULL DEFAULT FALSE,
  customer_decision           TEXT NOT NULL DEFAULT 'pending' CHECK (customer_decision IN (
    'pending', 'approved', 'rejected'
  )),
  device_returned             BOOLEAN NOT NULL DEFAULT FALSE,

  -- Adım 4 — Bakım / tamir
  work_description            TEXT,
  delivery_method             TEXT CHECK (delivery_method IS NULL OR delivery_method IN (
    'on_site', 'customer_pickup', 'shipped_cod'
  )),
  delivered                   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Adım 5 — Fatura + ödeme
  invoice_issued              BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_number              TEXT,
  payment_received            BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at                TIMESTAMPTZ,

  deleted_at                  TIMESTAMPTZ,
  deleted_by                  UUID REFERENCES users(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID NOT NULL REFERENCES users(id),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_service_request_completed CHECK (
    status <> 'tamamlandi'
    OR (
      invoice_number IS NOT NULL
      AND btrim(invoice_number) <> ''
      AND payment_received = TRUE
    )
  ),
  CONSTRAINT chk_service_request_rejected CHECK (
    status <> 'rejected'
    OR (customer_decision = 'rejected' AND device_returned = TRUE)
  )
);

CREATE INDEX IF NOT EXISTS idx_sr_branch
  ON service_requests(branch_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sr_status
  ON service_requests(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sr_technician
  ON service_requests(assigned_technician_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sr_number
  ON service_requests(request_number);

CREATE INDEX IF NOT EXISTS idx_sr_created
  ON service_requests(created_at DESC)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- service_request_quote_lines (Adım 3 teklif satırları)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_request_quote_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id  UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  description         TEXT NOT NULL,
  unit_price          NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity            NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  line_total          NUMERIC(12, 2) GENERATED ALWAYS AS (
    ROUND(unit_price * quantity, 2)
  ) STORED,
  sort_order          SMALLINT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sr_quote_lines_sr
  ON service_request_quote_lines(service_request_id, sort_order);

-- =============================================================================
-- service_request_parts (Adım 4 — stoktan düşülen parçalar)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_request_parts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id      UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  part_id               UUID NOT NULL REFERENCES parts(id),
  quantity              NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  inventory_movement_id UUID REFERENCES inventory_movements(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sr_parts_sr
  ON service_request_parts(service_request_id);

CREATE INDEX IF NOT EXISTS idx_sr_parts_part
  ON service_request_parts(part_id);

-- =============================================================================
-- service_request_photos (Adım 2 ve 4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_request_photos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id  UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  step                SMALLINT NOT NULL CHECK (step IN (2, 4)),
  storage_path        TEXT NOT NULL,
  file_name           TEXT NOT NULL,
  mime_type           TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
  uploaded_by         UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sr_photos_sr
  ON service_request_photos(service_request_id, step);

-- =============================================================================
-- generate_service_request_number — ST-2026-0001
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_service_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.request_number IS NULL OR btrim(NEW.request_number) = '' THEN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(request_number FROM 'ST-' || year_str || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM service_requests
    WHERE request_number LIKE 'ST-' || year_str || '-%';

    NEW.request_number := 'ST-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_service_request_number ON service_requests;
CREATE TRIGGER trg_generate_service_request_number
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_service_request_number();

DROP TRIGGER IF EXISTS trg_service_requests_updated_at ON service_requests;
CREATE TRIGGER trg_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Stok trigger — service_request_parts
-- =============================================================================
CREATE OR REPLACE FUNCTION reduce_stock_on_service_request_part_use()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sr_branch_id UUID;
  movement_id UUID;
  current_qty NUMERIC;
BEGIN
  SELECT branch_id
  INTO sr_branch_id
  FROM service_requests
  WHERE id = NEW.service_request_id
    AND deleted_at IS NULL;

  IF sr_branch_id IS NULL THEN
    RAISE EXCEPTION 'service_request % not found for stock reduction', NEW.service_request_id;
  END IF;

  SELECT COALESCE(current_quantity, 0)
  INTO current_qty
  FROM current_stock
  WHERE part_id = NEW.part_id
    AND branch_id = sr_branch_id;

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
    sr_branch_id,
    'service_request_usage',
    -NEW.quantity,
    'service_request',
    NEW.service_request_id,
    'Servis talebi parça kullanımı',
    NEW.created_by
  )
  RETURNING id INTO movement_id;

  NEW.inventory_movement_id := movement_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION restore_stock_on_service_request_part_remove()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sr_branch_id UUID;
BEGIN
  SELECT branch_id
  INTO sr_branch_id
  FROM service_requests
  WHERE id = OLD.service_request_id;

  IF sr_branch_id IS NULL THEN
    RAISE EXCEPTION 'service_request % not found for stock restore', OLD.service_request_id;
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
    sr_branch_id,
    'return',
    OLD.quantity,
    'service_request',
    OLD.service_request_id,
    'Servis talebi parça iadesi',
    auth.uid()
  );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_reduce_stock_on_sr_part_use ON service_request_parts;
CREATE TRIGGER trg_reduce_stock_on_sr_part_use
  BEFORE INSERT ON service_request_parts
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_service_request_part_use();

DROP TRIGGER IF EXISTS trg_restore_stock_on_sr_part_remove ON service_request_parts;
CREATE TRIGGER trg_restore_stock_on_sr_part_remove
  BEFORE DELETE ON service_request_parts
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_service_request_part_remove();

-- =============================================================================
-- RLS helpers
-- =============================================================================
CREATE OR REPLACE FUNCTION public.service_request_in_staff_branch(p_service_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_requests sr
    WHERE sr.id = p_service_request_id
      AND sr.deleted_at IS NULL
      AND sr.branch_id = public.user_branch_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.service_request_editable_by_current_user(p_service_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_requests sr
    WHERE sr.id = p_service_request_id
      AND sr.deleted_at IS NULL
      AND sr.branch_id = public.user_branch_id()
      AND sr.assigned_technician_id = auth.uid()
      AND sr.status NOT IN ('tamamlandi', 'rejected')
  );
$$;

-- =============================================================================
-- RLS — service_requests
-- =============================================================================
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_requests_admin_all ON service_requests;
CREATE POLICY service_requests_admin_all ON service_requests
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS service_requests_staff_select ON service_requests;
CREATE POLICY service_requests_staff_select ON service_requests
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS service_requests_staff_insert ON service_requests;
CREATE POLICY service_requests_staff_insert ON service_requests
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND assigned_technician_id = auth.uid()
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS service_requests_staff_update ON service_requests;
CREATE POLICY service_requests_staff_update ON service_requests
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND assigned_technician_id = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND assigned_technician_id = auth.uid()
);

-- =============================================================================
-- RLS — service_request_quote_lines
-- =============================================================================
ALTER TABLE service_request_quote_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_request_quote_lines_admin_all ON service_request_quote_lines;
CREATE POLICY service_request_quote_lines_admin_all ON service_request_quote_lines
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS service_request_quote_lines_staff_select ON service_request_quote_lines;
CREATE POLICY service_request_quote_lines_staff_select ON service_request_quote_lines
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_in_staff_branch(service_request_id)
);

DROP POLICY IF EXISTS service_request_quote_lines_staff_insert ON service_request_quote_lines;
CREATE POLICY service_request_quote_lines_staff_insert ON service_request_quote_lines
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);

DROP POLICY IF EXISTS service_request_quote_lines_staff_update ON service_request_quote_lines;
CREATE POLICY service_request_quote_lines_staff_update ON service_request_quote_lines
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);

DROP POLICY IF EXISTS service_request_quote_lines_staff_delete ON service_request_quote_lines;
CREATE POLICY service_request_quote_lines_staff_delete ON service_request_quote_lines
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);

-- =============================================================================
-- RLS — service_request_parts
-- =============================================================================
ALTER TABLE service_request_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_request_parts_admin_all ON service_request_parts;
CREATE POLICY service_request_parts_admin_all ON service_request_parts
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS service_request_parts_staff_select ON service_request_parts;
CREATE POLICY service_request_parts_staff_select ON service_request_parts
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_in_staff_branch(service_request_id)
);

DROP POLICY IF EXISTS service_request_parts_staff_insert ON service_request_parts;
CREATE POLICY service_request_parts_staff_insert ON service_request_parts
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);

DROP POLICY IF EXISTS service_request_parts_staff_delete ON service_request_parts;
CREATE POLICY service_request_parts_staff_delete ON service_request_parts
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);

-- =============================================================================
-- RLS — service_request_photos
-- =============================================================================
ALTER TABLE service_request_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_request_photos_admin_all ON service_request_photos;
CREATE POLICY service_request_photos_admin_all ON service_request_photos
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS service_request_photos_staff_select ON service_request_photos;
CREATE POLICY service_request_photos_staff_select ON service_request_photos
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_in_staff_branch(service_request_id)
);

DROP POLICY IF EXISTS service_request_photos_staff_insert ON service_request_photos;
CREATE POLICY service_request_photos_staff_insert ON service_request_photos
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);

DROP POLICY IF EXISTS service_request_photos_staff_delete ON service_request_photos;
CREATE POLICY service_request_photos_staff_delete ON service_request_photos
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.service_request_editable_by_current_user(service_request_id)
);
