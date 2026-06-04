-- TEKODAK OPS — 001_initial_schema.sql
-- Source: docs/spec/02-DATA-MODEL.md
-- 44 tables + 1 materialized view (target_progress view in 004)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- branches
CREATE TABLE IF NOT EXISTS branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  code            TEXT UNIQUE NOT NULL,
  address         TEXT,
  city            TEXT,
  phone           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  is_headquarters BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- brands
CREATE TABLE IF NOT EXISTS brands (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT UNIQUE NOT NULL,
  description            TEXT,
  default_warranty_years INTEGER DEFAULT 2,
  is_active              BOOLEAN DEFAULT TRUE,
  display_order          INTEGER DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- device_models
CREATE TABLE IF NOT EXISTS device_models (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id            UUID NOT NULL REFERENCES brands(id),
  model_name          TEXT NOT NULL,
  category            TEXT,
  default_voltage     TEXT,
  default_power_watt  INTEGER,
  default_capacity    TEXT,
  warranty_years      INTEGER,
  is_active           BOOLEAN DEFAULT TRUE,
  display_order       INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_brand_model UNIQUE (brand_id, model_name)
);

CREATE INDEX IF NOT EXISTS idx_models_brand ON device_models(brand_id) WHERE is_active = TRUE;

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_type TEXT NOT NULL CHECK (category_type IN (
    'customer_sector', 'device_category', 'part_category',
    'contract_type', 'work_type'
  )),
  code          TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  description   TEXT,
  display_order INTEGER DEFAULT 0,
  icon          TEXT,
  color         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  is_system     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_category_code UNIQUE (category_type, code)
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type) WHERE is_active = TRUE;

-- users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  branch_id       UUID REFERENCES branches(id),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES users(id),
  
  CONSTRAINT chk_admin_no_branch CHECK (
    (role = 'admin' AND branch_id IS NULL) OR
    (role = 'staff' AND branch_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  description     TEXT,
  ip_address      INET,
  user_agent      TEXT,
  branch_id       UUID REFERENCES branches(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at DESC);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  action_url      TEXT,
  priority        TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_entity ON notifications(entity_type, entity_id);

-- user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  ip_address        INET,
  user_agent        TEXT,
  device_type       TEXT,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, ended_at) 
  WHERE ended_at IS NULL;

-- notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description   TEXT,
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category      TEXT,
  description   TEXT,
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- data_exports
CREATE TABLE IF NOT EXISTS data_exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  export_type     TEXT NOT NULL,
  format          TEXT NOT NULL,
  filters_applied JSONB,
  record_count    INTEGER,
  file_size_bytes BIGINT,
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_user ON data_exports(user_id, created_at DESC);

-- customers
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  tax_office      TEXT,
  tax_number      TEXT NOT NULL,
  customer_type   TEXT NOT NULL CHECK (customer_type IN ('public', 'private', 'individual')),
  sector          TEXT,
  main_phone      TEXT,
  email           TEXT,
  website         TEXT,
  city            TEXT,
  district        TEXT,
  full_address    TEXT,
  notes           TEXT,
  branch_id       UUID NOT NULL REFERENCES branches(id),
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID NOT NULL REFERENCES users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES users(id),
  
  CONSTRAINT unique_tax_number UNIQUE (tax_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_tax ON customers(tax_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector('turkish', name));
CREATE INDEX IF NOT EXISTS idx_customers_sector ON customers(sector);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

-- customer_contacts
CREATE TABLE IF NOT EXISTS customer_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  title         TEXT,
  phone         TEXT,
  email         TEXT,
  is_primary    BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_customer ON customer_contacts(customer_id);

-- customer_responsible_users
CREATE TABLE IF NOT EXISTS customer_responsible_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  is_primary    BOOLEAN DEFAULT FALSE,
  assigned_at   TIMESTAMPTZ DEFAULT NOW(),
  assigned_by   UUID REFERENCES users(id),
  
  CONSTRAINT unique_customer_user UNIQUE (customer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resp_customer ON customer_responsible_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_resp_user ON customer_responsible_users(user_id);

-- customer_pins
CREATE TABLE IF NOT EXISTS customer_pins (
  user_id     UUID NOT NULL REFERENCES users(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  pinned_at   TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, customer_id)
);

-- customer_files
CREATE TABLE IF NOT EXISTS customer_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type       TEXT NOT NULL,
  category        TEXT,
  description     TEXT,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by     UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_customer_files_customer ON customer_files(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customer_files_category ON customer_files(category);

-- devices
CREATE TABLE IF NOT EXISTS devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number       TEXT NOT NULL,
  brand_id            UUID NOT NULL REFERENCES brands(id),
  model_id            UUID NOT NULL REFERENCES device_models(id),
  manufacturing_year  INTEGER,
  customer_id         UUID NOT NULL REFERENCES customers(id),
  location_address    TEXT,
  location_note       TEXT,
  warranty_start_date DATE,
  warranty_end_date   DATE,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_service', 'scrapped', 'warranty_only')),
  responsible_user_id UUID REFERENCES users(id),
  voltage             TEXT,
  power_watt          INTEGER,
  capacity            TEXT,
  color               TEXT,
  dimensions          TEXT,
  weight_kg           NUMERIC(8, 2),
  notes               TEXT,
  branch_id           UUID NOT NULL REFERENCES branches(id),
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID NOT NULL REFERENCES users(id),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_by          UUID REFERENCES users(id),
  
  CONSTRAINT unique_serial UNIQUE (serial_number),
  CONSTRAINT chk_warranty CHECK (warranty_end_date IS NULL OR warranty_end_date >= warranty_start_date)
);

CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_devices_customer ON devices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_devices_branch ON devices(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_devices_responsible ON devices(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_warranty ON devices(warranty_end_date) WHERE status = 'active';

-- device_files
CREATE TABLE IF NOT EXISTS device_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type       TEXT NOT NULL,
  category        TEXT,
  description     TEXT,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by     UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_device_files_device ON device_files(device_id) WHERE deleted_at IS NULL;

-- device_pins
CREATE TABLE IF NOT EXISTS device_pins (
  user_id   UUID NOT NULL REFERENCES users(id),
  device_id UUID NOT NULL REFERENCES devices(id),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, device_id)
);

-- contracts
CREATE TABLE IF NOT EXISTS contracts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number          TEXT UNIQUE NOT NULL,
  customer_id              UUID NOT NULL REFERENCES customers(id),
  contract_type            TEXT NOT NULL CHECK (contract_type IN (
    'annual_maintenance', 'semi_annual_maintenance', 'periodic_project',
    'warranty_extension', 'one_time_service', 'other'
  )),
  start_date               DATE NOT NULL,
  end_date                 DATE NOT NULL,
  annual_maintenance_count INTEGER DEFAULT 0,
  sla_response_hours       INTEGER DEFAULT 48,
  parts_included           BOOLEAN DEFAULT TRUE,
  travel_included          BOOLEAN DEFAULT TRUE,
  working_hours            TEXT DEFAULT 'business' CHECK (working_hours IN ('business', '24/7')),
  list_price               NUMERIC(12, 2),
  minimum_price            NUMERIC(12, 2),
  agreed_price             NUMERIC(12, 2) NOT NULL,
  override_reason          TEXT,
  payment_method           TEXT DEFAULT 'annual_prepaid' CHECK (payment_method IN (
    'annual_prepaid', 'semi_annual', 'quarterly', 'monthly', 'per_service'
  )),
  vat_included             BOOLEAN DEFAULT TRUE,
  vat_rate                 NUMERIC(5, 2) DEFAULT 20.00,
  status                   TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'renewal_approaching', 'expiring_soon',
    'renewed', 'expired', 'cancelled'
  )),
  responsible_user_id      UUID NOT NULL REFERENCES users(id),
  renewed_from_id          UUID REFERENCES contracts(id),
  renewed_to_id            UUID REFERENCES contracts(id),
  special_terms            TEXT,
  notes                    TEXT,
  branch_id                UUID NOT NULL REFERENCES branches(id),
  cancelled_at             TIMESTAMPTZ,
  cancelled_by             UUID REFERENCES users(id),
  cancellation_reason      TEXT,
  deleted_at               TIMESTAMPTZ,
  deleted_by               UUID REFERENCES users(id),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  created_by               UUID NOT NULL REFERENCES users(id),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_by               UUID REFERENCES users(id),
  
  CONSTRAINT chk_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_prices CHECK (
    minimum_price IS NULL OR list_price IS NULL OR minimum_price <= list_price
  )
);

CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_branch ON contracts(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_responsible ON contracts(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date) 
  WHERE status IN ('active', 'renewal_approaching', 'expiring_soon');
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_chain ON contracts(renewed_from_id);

-- contract_devices
CREATE TABLE IF NOT EXISTS contract_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  device_id     UUID NOT NULL REFERENCES devices(id),
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  added_by      UUID REFERENCES users(id),
  removed_at    TIMESTAMPTZ,
  removed_by    UUID REFERENCES users(id),
  
  CONSTRAINT unique_contract_device UNIQUE (contract_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_contract_devices_contract ON contract_devices(contract_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contract_devices_device ON contract_devices(device_id) WHERE removed_at IS NULL;

-- contract_files
CREATE TABLE IF NOT EXISTS contract_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  file_name           TEXT NOT NULL,
  storage_path        TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL,
  mime_type           TEXT NOT NULL,
  category            TEXT CHECK (category IN (
    'signed_contract', 'tender_doc', 'proposal', 'amendment', 'invoice_ref', 'other'
  )),
  description         TEXT,
  is_primary_document BOOLEAN DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID REFERENCES users(id),
  uploaded_at         TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by         UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contract_files_contract ON contract_files(contract_id) WHERE deleted_at IS NULL;

-- contract_renewal_reminders
CREATE TABLE IF NOT EXISTS contract_renewal_reminders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  days_before         INTEGER NOT NULL,
  triggered_at        TIMESTAMPTZ DEFAULT NOW(),
  notified_user_ids   UUID[] NOT NULL,
  notification_count  INTEGER DEFAULT 0,
  
  CONSTRAINT unique_contract_days UNIQUE (contract_id, days_before)
);

CREATE INDEX IF NOT EXISTS idx_renewal_reminders_contract ON contract_renewal_reminders(contract_id);

-- pricing_rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contract_type   TEXT,
  brand_id        UUID REFERENCES brands(id),
  device_model_id UUID REFERENCES device_models(id),
  list_price      NUMERIC(12, 2) NOT NULL,
  minimum_price   NUMERIC(12, 2) NOT NULL,
  valid_from      DATE DEFAULT CURRENT_DATE,
  valid_until     DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_pricing CHECK (minimum_price <= list_price)
);

CREATE INDEX IF NOT EXISTS idx_pricing_brand ON pricing_rules(brand_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pricing_model ON pricing_rules(device_model_id) WHERE is_active = TRUE;

-- parts
CREATE TABLE IF NOT EXISTS parts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_code       TEXT UNIQUE NOT NULL,
  description     TEXT NOT NULL,
  brand_id        UUID REFERENCES brands(id),
  category        TEXT NOT NULL CHECK (category IN (
    'blade_cutter', 'motor_electric', 'sensor_electronic',
    'oil_fluid', 'rubber_roller', 'filter',
    'screw_bolt', 'cable_connection', 'other'
  )),
  unit            TEXT NOT NULL DEFAULT 'piece' CHECK (unit IN (
    'piece', 'liter', 'meter', 'kg', 'package'
  )),
  list_price      NUMERIC(12, 2),
  minimum_price   NUMERIC(12, 2),
  unit_cost       NUMERIC(12, 2),
  supplier_name   TEXT,
  supplier_code   TEXT,
  lead_time_days  INTEGER,
  notes           TEXT,
  photo_url       TEXT,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES users(id),
  
  CONSTRAINT chk_part_pricing CHECK (
    minimum_price IS NULL OR list_price IS NULL OR minimum_price <= list_price
  )
);

CREATE INDEX IF NOT EXISTS idx_parts_code ON parts(part_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_parts_brand ON parts(brand_id);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_search ON parts USING gin(to_tsvector('turkish', description));

-- part_compatibility
CREATE TABLE IF NOT EXISTS part_compatibility (
  part_id         UUID NOT NULL REFERENCES parts(id),
  device_model_id UUID NOT NULL REFERENCES device_models(id),
  notes           TEXT,
  added_at        TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (part_id, device_model_id)
);

CREATE INDEX IF NOT EXISTS idx_compat_part ON part_compatibility(part_id);
CREATE INDEX IF NOT EXISTS idx_compat_model ON part_compatibility(device_model_id);

-- part_branch_stock
CREATE TABLE IF NOT EXISTS part_branch_stock (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id     UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  branch_id   UUID NOT NULL REFERENCES branches(id),
  min_stock   NUMERIC(10, 2) DEFAULT 0,
  max_stock   NUMERIC(10, 2),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_part_branch UNIQUE (part_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_stock_branch ON part_branch_stock(branch_id);

-- inventory_movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id               UUID NOT NULL REFERENCES parts(id),
  branch_id             UUID NOT NULL REFERENCES branches(id),
  movement_type         TEXT NOT NULL CHECK (movement_type IN (
    'stock_in', 'work_order_usage', 'manual_out',
    'transfer_out', 'transfer_in', 'adjustment', 'return'
  )),
  quantity_change       NUMERIC(10, 2) NOT NULL,
  reference_type        TEXT,
  reference_id          UUID,
  supplier_order_number TEXT,
  unit_cost             NUMERIC(12, 2),
  reason                TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  created_by            UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_movements_part_branch ON inventory_movements(part_id, branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_branch ON inventory_movements(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_ref ON inventory_movements(reference_type, reference_id);

-- inventory_transfers
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_branch_id    UUID NOT NULL REFERENCES branches(id),
  target_branch_id    UUID NOT NULL REFERENCES branches(id),
  part_id             UUID NOT NULL REFERENCES parts(id),
  quantity            NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  delivery_method     TEXT CHECK (delivery_method IN ('cargo', 'hand_delivery', 'other')),
  reason              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  approved_by         UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  source_movement_id  UUID REFERENCES inventory_movements(id),
  target_movement_id  UUID REFERENCES inventory_movements(id),
  requested_at        TIMESTAMPTZ DEFAULT NOW(),
  requested_by        UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT chk_different_branches CHECK (source_branch_id != target_branch_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON inventory_transfers(source_branch_id);
CREATE INDEX IF NOT EXISTS idx_transfers_target ON inventory_transfers(target_branch_id);

-- work_orders
CREATE TABLE IF NOT EXISTS work_orders (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number           TEXT UNIQUE NOT NULL,
  customer_id                 UUID NOT NULL REFERENCES customers(id),
  device_id                   UUID REFERENCES devices(id),
  contract_id                 UUID REFERENCES contracts(id),
  work_type                   TEXT NOT NULL CHECK (work_type IN (
    'repair', 'periodic_maintenance', 'installation', 
    'part_replacement', 'inspection', 'other'
  )),
  priority                    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'urgent', 'high', 'normal', 'low'
  )),
  status                      TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'
  )),
  problem_description         TEXT NOT NULL,
  customer_contact_id         UUID REFERENCES customer_contacts(id),
  service_location            TEXT,
  service_location_note       TEXT,
  assigned_to                 UUID REFERENCES users(id),
  assigned_at                 TIMESTAMPTZ,
  assigned_by                 UUID REFERENCES users(id),
  is_cross_branch             BOOLEAN DEFAULT FALSE,
  cross_branch_approved_by    UUID REFERENCES users(id),
  cross_branch_approved_at    TIMESTAMPTZ,
  scheduled_date              DATE,
  scheduled_time              TIME,
  estimated_duration_hours    NUMERIC(5, 2),
  work_started_at             TIMESTAMPTZ,
  work_ended_at               TIMESTAMPTZ,
  total_paused_seconds        INTEGER DEFAULT 0,
  actual_duration_hours       NUMERIC(7, 2),
  sla_deadline                TIMESTAMPTZ,
  sla_breached                BOOLEAN DEFAULT FALSE,
  resolution_status           TEXT CHECK (resolution_status IN (
    'fully_resolved', 'partially_resolved', 'not_resolved'
  )),
  work_performed              TEXT,
  internal_notes              TEXT,
  is_under_contract           BOOLEAN DEFAULT FALSE,
  is_billable                 BOOLEAN DEFAULT FALSE,
  customer_acknowledged_by    TEXT,
  customer_signature_url      TEXT,
  next_maintenance_suggested  DATE,
  next_maintenance_created    BOOLEAN DEFAULT FALSE,
  hold_reason                 TEXT,
  hold_started_at             TIMESTAMPTZ,
  cancelled_at                TIMESTAMPTZ,
  cancelled_by                UUID REFERENCES users(id),
  cancellation_reason         TEXT,
  branch_id                   UUID NOT NULL REFERENCES branches(id),
  deleted_at                  TIMESTAMPTZ,
  deleted_by                  UUID REFERENCES users(id),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  created_by                  UUID NOT NULL REFERENCES users(id),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_by                  UUID REFERENCES users(id),
  
  CONSTRAINT chk_work_dates CHECK (
    work_ended_at IS NULL OR work_ended_at >= work_started_at
  )
);

CREATE INDEX IF NOT EXISTS idx_wo_customer ON work_orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wo_device ON work_orders(device_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wo_branch ON work_orders(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wo_assigned ON work_orders(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_wo_scheduled ON work_orders(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_wo_sla ON work_orders(sla_deadline) 
  WHERE sla_breached = FALSE AND status NOT IN ('completed', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_wo_number ON work_orders(work_order_number);

-- work_order_activities
CREATE TABLE IF NOT EXISTS work_order_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'assigned', 'reassigned', 'status_changed', 'priority_changed',
    'started', 'paused', 'resumed', 'completed', 'cancelled',
    'note_added', 'part_added', 'part_removed', 'file_uploaded', 'edited'
  )),
  description   TEXT NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_activities_wo ON work_order_activities(work_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wo_activities_user ON work_order_activities(user_id, created_at DESC);

-- work_order_parts
CREATE TABLE IF NOT EXISTS work_order_parts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id               UUID NOT NULL REFERENCES parts(id),
  quantity              NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price            NUMERIC(12, 2),
  total_price           NUMERIC(12, 2),
  is_chargeable         BOOLEAN DEFAULT FALSE,
  inventory_movement_id UUID REFERENCES inventory_movements(id),
  notes                 TEXT,
  added_at              TIMESTAMPTZ DEFAULT NOW(),
  added_by              UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wo_parts_wo ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_part ON work_order_parts(part_id);

-- work_order_photos
CREATE TABLE IF NOT EXISTS work_order_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  thumbnail_path  TEXT,
  file_size_bytes BIGINT NOT NULL,
  photo_type      TEXT CHECK (photo_type IN ('before', 'during', 'after', 'evidence')),
  caption         TEXT,
  taken_at        TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by     UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wo_photos_wo ON work_order_photos(work_order_id);

-- work_order_files
CREATE TABLE IF NOT EXISTS work_order_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type       TEXT NOT NULL,
  category        TEXT CHECK (category IN (
    'customer_request', 'previous_report', 'technical_doc', 'invoice', 'other'
  )),
  description     TEXT,
  deleted_at      TIMESTAMPTZ,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by     UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wo_files_wo ON work_order_files(work_order_id) WHERE deleted_at IS NULL;

-- targets
CREATE TABLE IF NOT EXISTS targets (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL,
  description            TEXT,
  branch_id              UUID REFERENCES branches(id),
  metric_type            TEXT NOT NULL CHECK (metric_type IN (
    'work_orders_completed', 'contracts_renewed', 'contracts_new',
    'response_time', 'first_time_fix', 'revenue_contracts'
  )),
  period_type            TEXT NOT NULL CHECK (period_type IN (
    'monthly', 'quarterly', 'yearly', 'custom'
  )),
  start_date             DATE NOT NULL,
  end_date               DATE NOT NULL,
  target_value           NUMERIC(12, 2) NOT NULL,
  reward_model           TEXT CHECK (reward_model IN (
    'flat_bonus', 'proportional', 'tiered', 'none'
  )),
  reward_config          JSONB,
  has_individual_targets BOOLEAN DEFAULT FALSE,
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'draft', 'active', 'completed', 'cancelled'
  )),
  final_value            NUMERIC(12, 2),
  completion_percentage  NUMERIC(5, 2),
  finalized_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  created_by             UUID NOT NULL REFERENCES users(id),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_target_dates CHECK (end_date > start_date),
  CONSTRAINT chk_target_value CHECK (target_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_targets_branch ON targets(branch_id);
CREATE INDEX IF NOT EXISTS idx_targets_period ON targets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_targets_status ON targets(status);
CREATE INDEX IF NOT EXISTS idx_targets_metric ON targets(metric_type);

-- individual_targets
CREATE TABLE IF NOT EXISTS individual_targets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id             UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id),
  individual_value      NUMERIC(12, 2) NOT NULL,
  achieved_value        NUMERIC(12, 2),
  completion_percentage NUMERIC(5, 2),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  assigned_by           UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT unique_target_user UNIQUE (target_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_indiv_target ON individual_targets(target_id);
CREATE INDEX IF NOT EXISTS idx_indiv_user ON individual_targets(user_id);

-- target_period_snapshots
CREATE TABLE IF NOT EXISTS target_period_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id             UUID NOT NULL REFERENCES targets(id),
  snapshot_date         DATE NOT NULL,
  team_target_value     NUMERIC(12, 2) NOT NULL,
  team_achieved_value   NUMERIC(12, 2) NOT NULL,
  team_completion_pct   NUMERIC(5, 2) NOT NULL,
  individual_results    JSONB,
  top_performer_user_id UUID REFERENCES users(id),
  finalized_by          UUID NOT NULL REFERENCES users(id),
  finalized_at          TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_target_snapshot UNIQUE (target_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON target_period_snapshots(snapshot_date DESC);

-- rewards
CREATE TABLE IF NOT EXISTS rewards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id   UUID REFERENCES targets(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  reward_type TEXT CHECK (reward_type IN (
    'bonus', 'gift', 'time_off', 'recognition', 'training', 'other'
  )),
  description TEXT NOT NULL,
  reward_date DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id, reward_date DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_target ON rewards(target_id);

-- announcements
CREATE TABLE IF NOT EXISTS announcements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'normal', 'important', 'critical'
  )),
  target_audience   TEXT NOT NULL CHECK (target_audience IN ('all', 'branch_specific')),
  target_branch_ids UUID[],
  publish_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  is_published      BOOLEAN DEFAULT TRUE,
  is_archived       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  created_by        UUID NOT NULL REFERENCES users(id),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_publish_dates CHECK (
    expires_at IS NULL OR expires_at > publish_at
  )
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(publish_at DESC) 
  WHERE is_published = TRUE AND is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- announcement_reads
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  read_at         TIMESTAMPTZ DEFAULT NOW(),
  device_type     TEXT,
  
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ann_reads_user ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_ann_reads_ann ON announcement_reads(announcement_id);

-- materialized_view_refresh_log
CREATE TABLE IF NOT EXISTS materialized_view_refresh_log (
  id                 BIGSERIAL PRIMARY KEY,
  view_name          TEXT NOT NULL,
  refresh_started_at TIMESTAMPTZ NOT NULL,
  refresh_ended_at   TIMESTAMPTZ,
  duration_ms        INTEGER,
  status             TEXT CHECK (status IN ('success', 'failed', 'running')),
  error_message      TEXT,
  triggered_by       TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mv_log_view ON materialized_view_refresh_log(view_name, refresh_started_at DESC);

-- cron_job_log
CREATE TABLE IF NOT EXISTS cron_job_log (
  id              BIGSERIAL PRIMARY KEY,
  job_name        TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  duration_ms     INTEGER,
  status          TEXT CHECK (status IN ('success', 'failed', 'running')),
  rows_processed  INTEGER,
  output_summary  JSONB,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_log_job ON cron_job_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_log_status ON cron_job_log(status);

-- email_queue
CREATE TABLE IF NOT EXISTS email_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email        TEXT NOT NULL,
  to_user_id      UUID REFERENCES users(id),
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  body_text       TEXT,
  template_name   TEXT,
  template_data   JSONB,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sending', 'sent', 'failed', 'cancelled'
  )),
  attempt_count   INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  priority        TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  context_type    TEXT,
  context_id      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, priority, created_at) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(to_user_id);

-- system_health_checks
CREATE TABLE IF NOT EXISTS system_health_checks (
  id          BIGSERIAL PRIMARY KEY,
  check_name  TEXT NOT NULL,
  check_type  TEXT,
  status      TEXT CHECK (status IN ('healthy', 'warning', 'critical')),
  value       NUMERIC,
  unit        TEXT,
  details     JSONB,
  checked_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_check_name ON system_health_checks(check_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_status ON system_health_checks(status, checked_at DESC);

-- current_stock (materialized view)
DROP MATERIALIZED VIEW IF EXISTS current_stock;
CREATE MATERIALIZED VIEW current_stock AS
SELECT 
  p.id AS part_id,
  p.part_code,
  p.description,
  b.id AS branch_id,
  b.name AS branch_name,
  COALESCE(SUM(im.quantity_change), 0) AS current_quantity,
  pbs.min_stock,
  pbs.max_stock,
  CASE 
    WHEN COALESCE(SUM(im.quantity_change), 0) <= 0 THEN 'critical'
    WHEN COALESCE(SUM(im.quantity_change), 0) < COALESCE(pbs.min_stock, 0) / 2 THEN 'critical'
    WHEN COALESCE(SUM(im.quantity_change), 0) < COALESCE(pbs.min_stock, 0) THEN 'warning'
    WHEN pbs.max_stock IS NOT NULL AND COALESCE(SUM(im.quantity_change), 0) > pbs.max_stock THEN 'excess'
    ELSE 'ok'
  END AS stock_status
FROM parts p
CROSS JOIN branches b
LEFT JOIN inventory_movements im ON im.part_id = p.id AND im.branch_id = b.id
LEFT JOIN part_branch_stock pbs ON pbs.part_id = p.id AND pbs.branch_id = b.id
WHERE p.deleted_at IS NULL AND b.is_active = TRUE
GROUP BY p.id, p.part_code, p.description, b.id, b.name, pbs.min_stock, pbs.max_stock;

CREATE UNIQUE INDEX IF NOT EXISTS idx_current_stock_part_branch_unique ON current_stock(part_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_current_stock_status ON current_stock(stock_status);
