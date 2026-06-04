-- TEKODAK OPS — 005_seed_data.sql
-- Reference / lookup data only (no mock customers, devices, or users)
-- Safe to re-run: ON CONFLICT DO NOTHING

-- =============================================================================
-- A) branches
-- =============================================================================
INSERT INTO branches (name, code, city, is_headquarters) VALUES
  ('Ankara', 'ANK', 'Ankara', TRUE),
  ('İstanbul', 'IST', 'İstanbul', FALSE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- B) brands
-- =============================================================================
INSERT INTO brands (name, default_warranty_years, display_order) VALUES
  ('KOBRA', 2, 1),
  ('HAGEL', 3, 2),
  ('Flexpack', 1, 3)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- C) categories — customer_sector (required minimum)
-- =============================================================================
INSERT INTO categories (category_type, code, display_name, display_order, is_system) VALUES
  ('customer_sector', 'public', 'Kamu Kurumu', 1, TRUE),
  ('customer_sector', 'banking', 'Bankacılık', 2, TRUE),
  ('customer_sector', 'health', 'Sağlık', 3, TRUE),
  ('customer_sector', 'education', 'Eğitim', 4, TRUE),
  ('customer_sector', 'service', 'Hizmet', 5, TRUE),
  ('customer_sector', 'other', 'Diğer', 99, TRUE)
ON CONFLICT (category_type, code) DO NOTHING;

-- categories — device_category
INSERT INTO categories (category_type, code, display_name, display_order, is_system) VALUES
  ('device_category', 'shredder', 'Kağıt İmha Makinesi', 1, TRUE),
  ('device_category', 'destroyer', 'Sabit Disk İmha', 2, TRUE),
  ('device_category', 'recycling', 'Geri Dönüşüm', 3, TRUE),
  ('device_category', 'other', 'Diğer', 99, TRUE)
ON CONFLICT (category_type, code) DO NOTHING;

-- categories — part_category (codes align with parts.category CHECK)
INSERT INTO categories (category_type, code, display_name, display_order, is_system) VALUES
  ('part_category', 'blade_cutter', 'Bıçak / Kesici', 1, TRUE),
  ('part_category', 'motor_electric', 'Motor / Elektrik', 2, TRUE),
  ('part_category', 'sensor_electronic', 'Sensör / Elektronik', 3, TRUE),
  ('part_category', 'oil_fluid', 'Yağ / Sıvı', 4, TRUE),
  ('part_category', 'rubber_roller', 'Kauçuk / Rulo', 5, TRUE),
  ('part_category', 'filter', 'Filtre', 6, TRUE),
  ('part_category', 'screw_bolt', 'Vida / Cıvata', 7, TRUE),
  ('part_category', 'cable_connection', 'Kablo / Bağlantı', 8, TRUE),
  ('part_category', 'other', 'Diğer', 99, TRUE)
ON CONFLICT (category_type, code) DO NOTHING;

-- categories — contract_type (codes align with contracts.contract_type CHECK)
INSERT INTO categories (category_type, code, display_name, display_order, is_system) VALUES
  ('contract_type', 'annual_maintenance', 'Yıllık Bakım', 1, TRUE),
  ('contract_type', 'semi_annual_maintenance', '6 Aylık Bakım', 2, TRUE),
  ('contract_type', 'periodic_project', 'Periyodik Proje', 3, TRUE),
  ('contract_type', 'warranty_extension', 'Garanti Uzatma', 4, TRUE),
  ('contract_type', 'one_time_service', 'Tek Seferlik Servis', 5, TRUE),
  ('contract_type', 'other', 'Diğer', 99, TRUE)
ON CONFLICT (category_type, code) DO NOTHING;

-- categories — work_type (codes align with work_orders.work_type CHECK)
INSERT INTO categories (category_type, code, display_name, display_order, is_system) VALUES
  ('work_type', 'repair', 'Arıza / Onarım', 1, TRUE),
  ('work_type', 'periodic_maintenance', 'Periyodik Bakım', 2, TRUE),
  ('work_type', 'installation', 'Kurulum', 3, TRUE),
  ('work_type', 'part_replacement', 'Parça Değişimi', 4, TRUE),
  ('work_type', 'inspection', 'Kontrol / Muayene', 5, TRUE),
  ('work_type', 'other', 'Diğer', 99, TRUE)
ON CONFLICT (category_type, code) DO NOTHING;

-- =============================================================================
-- D) system_settings
-- =============================================================================
INSERT INTO system_settings (setting_key, setting_value, category) VALUES
  ('kdv_rate', to_jsonb(20), 'pricing'),
  ('currency', to_jsonb('TRY'::text), 'pricing'),
  ('default_warranty_kobra_years', to_jsonb(2), 'general'),
  ('default_warranty_hagel_years', to_jsonb(3), 'general'),
  ('default_warranty_flexpack_years', to_jsonb(1), 'general'),
  ('soft_delete_retention_days', to_jsonb(30), 'security')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- E) notification_settings
-- =============================================================================
INSERT INTO notification_settings (setting_key, setting_value, description) VALUES
  (
    'contract_renewal_days',
    '[90, 60, 30, 15, 7]'::jsonb,
    'Sözleşme yenileme uyarı günleri'
  ),
  (
    'critical_stock_check_enabled',
    'true'::jsonb,
    'Kritik stok kontrolü aktif mi'
  ),
  (
    'work_order_assigned_notif',
    'true'::jsonb,
    'İş atandığında bildirim'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- Optional: refresh stock matview after reference data (no parts yet → empty OK)
-- =============================================================================
-- SELECT refresh_current_stock();
