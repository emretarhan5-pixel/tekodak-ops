-- TEKODAK OPS — 024_periodic_maintenance.sql
-- Periyodik bakım planları, sözleşme bakım sayaçları, RLS ve tamamlanma trigger'ı.
-- Çalıştırma sırası: 022 → 023 → 024

-- =============================================================================
-- contracts — bakım sayaçları
-- (annual_maintenance_count mevcut; total_maintenance_count uygulama tarafında
--  sözleşme formunda doldurulacak — mevcut kayıtlar annual'dan kopyalanır)
-- =============================================================================
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS total_maintenance_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_maintenance_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS chk_contracts_maintenance_counts;

ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_maintenance_counts CHECK (
    total_maintenance_count >= 0
    AND completed_maintenance_count >= 0
    AND completed_maintenance_count <= total_maintenance_count
  );

COMMENT ON COLUMN contracts.total_maintenance_count IS
  'Sözleşme kapsamındaki toplam periyodik bakım hakkı';
COMMENT ON COLUMN contracts.completed_maintenance_count IS
  'Tamamlanan periyodik bakım planı sayısı (trigger ile artar)';

-- Mevcut sözleşmeler: annual_maintenance_count → total_maintenance_count
UPDATE contracts
SET total_maintenance_count = GREATEST(
  COALESCE(annual_maintenance_count, 0),
  completed_maintenance_count
)
WHERE deleted_at IS NULL;

-- =============================================================================
-- periodic_maintenance_plans
-- =============================================================================
CREATE TABLE IF NOT EXISTS periodic_maintenance_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id             UUID NOT NULL REFERENCES contracts(id),
  branch_id               UUID NOT NULL REFERENCES branches(id),
  planned_date            DATE NOT NULL,
  assigned_technician_id  UUID NOT NULL REFERENCES users(id),
  status                  TEXT NOT NULL DEFAULT 'planned' CHECK (status IN (
    'planned',
    'in_progress',
    'completed',
    'cancelled'
  )),
  notes                   TEXT,
  completed_at            TIMESTAMPTZ,
  created_by              UUID NOT NULL REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  CONSTRAINT chk_pmp_completed_at CHECK (
    status <> 'completed'
    OR completed_at IS NOT NULL
  ),
  CONSTRAINT chk_pmp_cancelled_no_complete CHECK (
    status <> 'cancelled'
    OR completed_at IS NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_pmp_contract
  ON periodic_maintenance_plans(contract_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pmp_branch_status
  ON periodic_maintenance_plans(branch_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pmp_technician_status_date
  ON periodic_maintenance_plans(assigned_technician_id, status, planned_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pmp_planned_date
  ON periodic_maintenance_plans(planned_date)
  WHERE deleted_at IS NULL
    AND status IN ('planned', 'in_progress');

-- =============================================================================
-- periodic_maintenance_devices
-- =============================================================================
CREATE TABLE IF NOT EXISTS periodic_maintenance_devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_plan_id UUID NOT NULL REFERENCES periodic_maintenance_plans(id) ON DELETE CASCADE,
  device_id           UUID NOT NULL REFERENCES devices(id),
  serial_number       TEXT NOT NULL,
  work_notes          TEXT,
  is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_pmp_device UNIQUE (maintenance_plan_id, device_id),
  CONSTRAINT chk_pmd_completed_at CHECK (
    NOT is_completed
    OR completed_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_pmd_plan
  ON periodic_maintenance_devices(maintenance_plan_id);

CREATE INDEX IF NOT EXISTS idx_pmd_device
  ON periodic_maintenance_devices(device_id);

-- =============================================================================
-- Trigger: şube = sözleşme şubesi
-- =============================================================================
CREATE OR REPLACE FUNCTION periodic_maintenance_plan_sync_branch()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  SELECT c.branch_id
  INTO v_branch_id
  FROM contracts c
  WHERE c.id = NEW.contract_id
    AND c.deleted_at IS NULL;

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Sözleşme bulunamadı veya silinmiş: %', NEW.contract_id;
  END IF;

  NEW.branch_id := v_branch_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pmp_sync_branch ON periodic_maintenance_plans;
CREATE TRIGGER trg_pmp_sync_branch
  BEFORE INSERT OR UPDATE OF contract_id ON periodic_maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION periodic_maintenance_plan_sync_branch();

-- =============================================================================
-- Trigger: plan updated_at
-- =============================================================================
DROP TRIGGER IF EXISTS trg_pmp_updated_at ON periodic_maintenance_plans;
CREATE TRIGGER trg_pmp_updated_at
  BEFORE UPDATE ON periodic_maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Trigger: cihaz sözleşmede olmalı + seri no snapshot
-- =============================================================================
CREATE OR REPLACE FUNCTION periodic_maintenance_device_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_contract_id UUID;
  v_serial TEXT;
BEGIN
  SELECT pmp.contract_id
  INTO v_contract_id
  FROM periodic_maintenance_plans pmp
  WHERE pmp.id = NEW.maintenance_plan_id
    AND pmp.deleted_at IS NULL;

  IF v_contract_id IS NULL THEN
    RAISE EXCEPTION 'Bakım planı bulunamadı: %', NEW.maintenance_plan_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM contract_devices cd
    WHERE cd.contract_id = v_contract_id
      AND cd.device_id = NEW.device_id
      AND cd.removed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cihaz bu sözleşmeye bağlı değil';
  END IF;

  IF NEW.serial_number IS NULL OR btrim(NEW.serial_number) = '' THEN
    SELECT d.serial_number
    INTO v_serial
    FROM devices d
    WHERE d.id = NEW.device_id
      AND d.deleted_at IS NULL;

    IF v_serial IS NULL OR btrim(v_serial) = '' THEN
      RAISE EXCEPTION 'Cihaz seri numarası bulunamadı';
    END IF;

    NEW.serial_number := btrim(v_serial);
  ELSE
    NEW.serial_number := btrim(NEW.serial_number);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pmd_validate ON periodic_maintenance_devices;
CREATE TRIGGER trg_pmd_validate
  BEFORE INSERT OR UPDATE ON periodic_maintenance_devices
  FOR EACH ROW
  EXECUTE FUNCTION periodic_maintenance_device_validate();

-- =============================================================================
-- Trigger: cihaz tamamlanınca completed_at
-- =============================================================================
CREATE OR REPLACE FUNCTION periodic_maintenance_device_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_completed IS TRUE AND (TG_OP = 'INSERT' OR OLD.is_completed IS DISTINCT FROM TRUE) THEN
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
  ELSIF NEW.is_completed IS FALSE THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pmd_completed_at ON periodic_maintenance_devices;
CREATE TRIGGER trg_pmd_completed_at
  BEFORE INSERT OR UPDATE OF is_completed ON periodic_maintenance_devices
  FOR EACH ROW
  EXECUTE FUNCTION periodic_maintenance_device_completed_at();

-- =============================================================================
-- Trigger: plan tamamlanınca sözleşme sayacı + doğrulamalar
-- =============================================================================
CREATE OR REPLACE FUNCTION periodic_maintenance_plan_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_open_devices INTEGER;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Tamamlanmış plan geri alınamaz
  IF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
    RAISE EXCEPTION 'Tamamlanan bakım planı geri alınamaz';
  END IF;

  IF NEW.status = 'completed' THEN
    SELECT COUNT(*)::INTEGER
    INTO v_open_devices
    FROM periodic_maintenance_devices pmd
    WHERE pmd.maintenance_plan_id = NEW.id
      AND pmd.is_completed IS FALSE;

    IF v_open_devices > 0 THEN
      RAISE EXCEPTION 'Tüm cihazlar tamamlanmadan bakım planı kapatılamaz (% kalan)', v_open_devices;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM periodic_maintenance_devices pmd
      WHERE pmd.maintenance_plan_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Bakım planında en az bir cihaz olmalıdır';
    END IF;

    SELECT total_maintenance_count, completed_maintenance_count
    INTO v_total, v_completed
    FROM contracts
    WHERE id = NEW.contract_id
      AND deleted_at IS NULL
    FOR UPDATE;

    IF v_total IS NULL THEN
      RAISE EXCEPTION 'Sözleşme bulunamadı';
    END IF;

    IF v_completed >= v_total THEN
      RAISE EXCEPTION 'Sözleşme bakım kotası dolmuş (% / %)', v_completed, v_total;
    END IF;

    NEW.completed_at := COALESCE(NEW.completed_at, NOW());

    UPDATE contracts
    SET
      completed_maintenance_count = completed_maintenance_count + 1,
      updated_at = NOW()
    WHERE id = NEW.contract_id;
  END IF;

  IF NEW.status = 'cancelled' THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pmp_on_complete ON periodic_maintenance_plans;
CREATE TRIGGER trg_pmp_on_complete
  BEFORE UPDATE OF status ON periodic_maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION periodic_maintenance_plan_on_complete();

-- =============================================================================
-- RLS helpers
-- =============================================================================
CREATE OR REPLACE FUNCTION public.periodic_maintenance_plan_in_staff_branch(p_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM periodic_maintenance_plans pmp
    WHERE pmp.id = p_plan_id
      AND pmp.deleted_at IS NULL
      AND pmp.branch_id = public.user_branch_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.periodic_maintenance_plan_editable_by_current_user(p_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM periodic_maintenance_plans pmp
    WHERE pmp.id = p_plan_id
      AND pmp.deleted_at IS NULL
      AND pmp.branch_id = public.user_branch_id()
      AND pmp.assigned_technician_id = auth.uid()
      AND pmp.status IN ('planned', 'in_progress')
  );
$$;

-- =============================================================================
-- RLS — periodic_maintenance_plans
-- =============================================================================
ALTER TABLE periodic_maintenance_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS periodic_maintenance_plans_admin_all ON periodic_maintenance_plans;
CREATE POLICY periodic_maintenance_plans_admin_all ON periodic_maintenance_plans
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS periodic_maintenance_plans_staff_select ON periodic_maintenance_plans;
CREATE POLICY periodic_maintenance_plans_staff_select ON periodic_maintenance_plans
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS periodic_maintenance_plans_staff_insert ON periodic_maintenance_plans;
CREATE POLICY periodic_maintenance_plans_staff_insert ON periodic_maintenance_plans
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND assigned_technician_id = auth.uid()
  AND created_by = auth.uid()
  AND status IN ('planned', 'in_progress')
);

DROP POLICY IF EXISTS periodic_maintenance_plans_staff_update ON periodic_maintenance_plans;
CREATE POLICY periodic_maintenance_plans_staff_update ON periodic_maintenance_plans
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
-- RLS — periodic_maintenance_devices
-- =============================================================================
ALTER TABLE periodic_maintenance_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS periodic_maintenance_devices_admin_all ON periodic_maintenance_devices;
CREATE POLICY periodic_maintenance_devices_admin_all ON periodic_maintenance_devices
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS periodic_maintenance_devices_staff_select ON periodic_maintenance_devices;
CREATE POLICY periodic_maintenance_devices_staff_select ON periodic_maintenance_devices
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.periodic_maintenance_plan_in_staff_branch(maintenance_plan_id)
);

DROP POLICY IF EXISTS periodic_maintenance_devices_staff_insert ON periodic_maintenance_devices;
CREATE POLICY periodic_maintenance_devices_staff_insert ON periodic_maintenance_devices
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.periodic_maintenance_plan_editable_by_current_user(maintenance_plan_id)
);

DROP POLICY IF EXISTS periodic_maintenance_devices_staff_update ON periodic_maintenance_devices;
CREATE POLICY periodic_maintenance_devices_staff_update ON periodic_maintenance_devices
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.periodic_maintenance_plan_editable_by_current_user(maintenance_plan_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.periodic_maintenance_plan_editable_by_current_user(maintenance_plan_id)
);

DROP POLICY IF EXISTS periodic_maintenance_devices_staff_delete ON periodic_maintenance_devices;
CREATE POLICY periodic_maintenance_devices_staff_delete ON periodic_maintenance_devices
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.periodic_maintenance_plan_editable_by_current_user(maintenance_plan_id)
);
