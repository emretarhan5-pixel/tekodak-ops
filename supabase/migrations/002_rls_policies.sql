-- TEKODAK OPS — 002_rls_policies.sql (bootstrap: admin + staff read only)
-- Branch isolation and soft-delete filters will be added in a later migration.

-- Helpers: avoid infinite RLS recursion when policies on `users` query `users`
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;

-- Remove policies from previous 002 attempts (failed runs left extra policy names)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS branches_admin_all ON branches;
CREATE POLICY branches_admin_all ON branches
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS branches_staff_read ON branches;
CREATE POLICY branches_staff_read ON branches
FOR SELECT TO authenticated
USING (public.is_active_user());

-- brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brands_admin_all ON brands;
CREATE POLICY brands_admin_all ON brands
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS brands_staff_read ON brands;
CREATE POLICY brands_staff_read ON brands
FOR SELECT TO authenticated
USING (public.is_active_user());

-- device_models
ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_models_admin_all ON device_models;
CREATE POLICY device_models_admin_all ON device_models
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS device_models_staff_read ON device_models;
CREATE POLICY device_models_staff_read ON device_models
FOR SELECT TO authenticated
USING (public.is_active_user());

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_admin_all ON categories;
CREATE POLICY categories_admin_all ON categories
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS categories_staff_read ON categories;
CREATE POLICY categories_staff_read ON categories
FOR SELECT TO authenticated
USING (public.is_active_user());

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS users_staff_read ON users;
CREATE POLICY users_staff_read ON users
FOR SELECT TO authenticated
USING (public.is_active_user());

-- audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_admin_all ON audit_log;
CREATE POLICY audit_log_admin_all ON audit_log
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS audit_log_staff_read ON audit_log;
CREATE POLICY audit_log_staff_read ON audit_log
FOR SELECT TO authenticated
USING (public.is_active_user());

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_admin_all ON notifications;
CREATE POLICY notifications_admin_all ON notifications
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS notifications_staff_read ON notifications;
CREATE POLICY notifications_staff_read ON notifications
FOR SELECT TO authenticated
USING (public.is_active_user());

-- user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_sessions_admin_all ON user_sessions;
CREATE POLICY user_sessions_admin_all ON user_sessions
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS user_sessions_staff_read ON user_sessions;
CREATE POLICY user_sessions_staff_read ON user_sessions
FOR SELECT TO authenticated
USING (public.is_active_user());

-- notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_settings_admin_all ON notification_settings;
CREATE POLICY notification_settings_admin_all ON notification_settings
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS notification_settings_staff_read ON notification_settings;
CREATE POLICY notification_settings_staff_read ON notification_settings
FOR SELECT TO authenticated
USING (public.is_active_user());

-- system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_settings_admin_all ON system_settings;
CREATE POLICY system_settings_admin_all ON system_settings
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS system_settings_staff_read ON system_settings;
CREATE POLICY system_settings_staff_read ON system_settings
FOR SELECT TO authenticated
USING (public.is_active_user());

-- data_exports
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS data_exports_admin_all ON data_exports;
CREATE POLICY data_exports_admin_all ON data_exports
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS data_exports_staff_read ON data_exports;
CREATE POLICY data_exports_staff_read ON data_exports
FOR SELECT TO authenticated
USING (public.is_active_user());

-- customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_admin_all ON customers;
CREATE POLICY customers_admin_all ON customers
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS customers_staff_read ON customers;
CREATE POLICY customers_staff_read ON customers
FOR SELECT TO authenticated
USING (public.is_active_user());

-- customer_contacts
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_contacts_admin_all ON customer_contacts;
CREATE POLICY customer_contacts_admin_all ON customer_contacts
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS customer_contacts_staff_read ON customer_contacts;
CREATE POLICY customer_contacts_staff_read ON customer_contacts
FOR SELECT TO authenticated
USING (public.is_active_user());

-- customer_responsible_users
ALTER TABLE customer_responsible_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_responsible_users_admin_all ON customer_responsible_users;
CREATE POLICY customer_responsible_users_admin_all ON customer_responsible_users
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS customer_responsible_users_staff_read ON customer_responsible_users;
CREATE POLICY customer_responsible_users_staff_read ON customer_responsible_users
FOR SELECT TO authenticated
USING (public.is_active_user());

-- customer_pins
ALTER TABLE customer_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_pins_admin_all ON customer_pins;
CREATE POLICY customer_pins_admin_all ON customer_pins
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS customer_pins_staff_read ON customer_pins;
CREATE POLICY customer_pins_staff_read ON customer_pins
FOR SELECT TO authenticated
USING (public.is_active_user());

-- customer_files
ALTER TABLE customer_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_files_admin_all ON customer_files;
CREATE POLICY customer_files_admin_all ON customer_files
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS customer_files_staff_read ON customer_files;
CREATE POLICY customer_files_staff_read ON customer_files
FOR SELECT TO authenticated
USING (public.is_active_user());

-- devices
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS devices_admin_all ON devices;
CREATE POLICY devices_admin_all ON devices
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS devices_staff_read ON devices;
CREATE POLICY devices_staff_read ON devices
FOR SELECT TO authenticated
USING (public.is_active_user());

-- device_files
ALTER TABLE device_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_files_admin_all ON device_files;
CREATE POLICY device_files_admin_all ON device_files
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS device_files_staff_read ON device_files;
CREATE POLICY device_files_staff_read ON device_files
FOR SELECT TO authenticated
USING (public.is_active_user());

-- device_pins
ALTER TABLE device_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_pins_admin_all ON device_pins;
CREATE POLICY device_pins_admin_all ON device_pins
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS device_pins_staff_read ON device_pins;
CREATE POLICY device_pins_staff_read ON device_pins
FOR SELECT TO authenticated
USING (public.is_active_user());

-- contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contracts_admin_all ON contracts;
CREATE POLICY contracts_admin_all ON contracts
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS contracts_staff_read ON contracts;
CREATE POLICY contracts_staff_read ON contracts
FOR SELECT TO authenticated
USING (public.is_active_user());

-- contract_devices
ALTER TABLE contract_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_devices_admin_all ON contract_devices;
CREATE POLICY contract_devices_admin_all ON contract_devices
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS contract_devices_staff_read ON contract_devices;
CREATE POLICY contract_devices_staff_read ON contract_devices
FOR SELECT TO authenticated
USING (public.is_active_user());

-- contract_files
ALTER TABLE contract_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_files_admin_all ON contract_files;
CREATE POLICY contract_files_admin_all ON contract_files
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS contract_files_staff_read ON contract_files;
CREATE POLICY contract_files_staff_read ON contract_files
FOR SELECT TO authenticated
USING (public.is_active_user());

-- contract_renewal_reminders
ALTER TABLE contract_renewal_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_renewal_reminders_admin_all ON contract_renewal_reminders;
CREATE POLICY contract_renewal_reminders_admin_all ON contract_renewal_reminders
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS contract_renewal_reminders_staff_read ON contract_renewal_reminders;
CREATE POLICY contract_renewal_reminders_staff_read ON contract_renewal_reminders
FOR SELECT TO authenticated
USING (public.is_active_user());

-- pricing_rules
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_rules_admin_all ON pricing_rules;
CREATE POLICY pricing_rules_admin_all ON pricing_rules
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS pricing_rules_staff_read ON pricing_rules;
CREATE POLICY pricing_rules_staff_read ON pricing_rules
FOR SELECT TO authenticated
USING (public.is_active_user());

-- parts
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parts_admin_all ON parts;
CREATE POLICY parts_admin_all ON parts
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS parts_staff_read ON parts;
CREATE POLICY parts_staff_read ON parts
FOR SELECT TO authenticated
USING (public.is_active_user());

-- part_compatibility
ALTER TABLE part_compatibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS part_compatibility_admin_all ON part_compatibility;
CREATE POLICY part_compatibility_admin_all ON part_compatibility
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS part_compatibility_staff_read ON part_compatibility;
CREATE POLICY part_compatibility_staff_read ON part_compatibility
FOR SELECT TO authenticated
USING (public.is_active_user());

-- part_branch_stock
ALTER TABLE part_branch_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS part_branch_stock_admin_all ON part_branch_stock;
CREATE POLICY part_branch_stock_admin_all ON part_branch_stock
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS part_branch_stock_staff_read ON part_branch_stock;
CREATE POLICY part_branch_stock_staff_read ON part_branch_stock
FOR SELECT TO authenticated
USING (public.is_active_user());

-- inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_movements_admin_all ON inventory_movements;
CREATE POLICY inventory_movements_admin_all ON inventory_movements
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS inventory_movements_staff_read ON inventory_movements;
CREATE POLICY inventory_movements_staff_read ON inventory_movements
FOR SELECT TO authenticated
USING (public.is_active_user());

-- inventory_transfers
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_transfers_admin_all ON inventory_transfers;
CREATE POLICY inventory_transfers_admin_all ON inventory_transfers
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS inventory_transfers_staff_read ON inventory_transfers;
CREATE POLICY inventory_transfers_staff_read ON inventory_transfers
FOR SELECT TO authenticated
USING (public.is_active_user());

-- work_orders
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_orders_admin_all ON work_orders;
CREATE POLICY work_orders_admin_all ON work_orders
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS work_orders_staff_read ON work_orders;
CREATE POLICY work_orders_staff_read ON work_orders
FOR SELECT TO authenticated
USING (public.is_active_user());

-- work_order_activities
ALTER TABLE work_order_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_order_activities_admin_all ON work_order_activities;
CREATE POLICY work_order_activities_admin_all ON work_order_activities
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS work_order_activities_staff_read ON work_order_activities;
CREATE POLICY work_order_activities_staff_read ON work_order_activities
FOR SELECT TO authenticated
USING (public.is_active_user());

-- work_order_parts
ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_order_parts_admin_all ON work_order_parts;
CREATE POLICY work_order_parts_admin_all ON work_order_parts
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS work_order_parts_staff_read ON work_order_parts;
CREATE POLICY work_order_parts_staff_read ON work_order_parts
FOR SELECT TO authenticated
USING (public.is_active_user());

-- work_order_photos
ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_order_photos_admin_all ON work_order_photos;
CREATE POLICY work_order_photos_admin_all ON work_order_photos
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS work_order_photos_staff_read ON work_order_photos;
CREATE POLICY work_order_photos_staff_read ON work_order_photos
FOR SELECT TO authenticated
USING (public.is_active_user());

-- work_order_files
ALTER TABLE work_order_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_order_files_admin_all ON work_order_files;
CREATE POLICY work_order_files_admin_all ON work_order_files
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS work_order_files_staff_read ON work_order_files;
CREATE POLICY work_order_files_staff_read ON work_order_files
FOR SELECT TO authenticated
USING (public.is_active_user());

-- targets
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS targets_admin_all ON targets;
CREATE POLICY targets_admin_all ON targets
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS targets_staff_read ON targets;
CREATE POLICY targets_staff_read ON targets
FOR SELECT TO authenticated
USING (public.is_active_user());

-- individual_targets
ALTER TABLE individual_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS individual_targets_admin_all ON individual_targets;
CREATE POLICY individual_targets_admin_all ON individual_targets
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS individual_targets_staff_read ON individual_targets;
CREATE POLICY individual_targets_staff_read ON individual_targets
FOR SELECT TO authenticated
USING (public.is_active_user());

-- target_period_snapshots
ALTER TABLE target_period_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS target_period_snapshots_admin_all ON target_period_snapshots;
CREATE POLICY target_period_snapshots_admin_all ON target_period_snapshots
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS target_period_snapshots_staff_read ON target_period_snapshots;
CREATE POLICY target_period_snapshots_staff_read ON target_period_snapshots
FOR SELECT TO authenticated
USING (public.is_active_user());

-- rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rewards_admin_all ON rewards;
CREATE POLICY rewards_admin_all ON rewards
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS rewards_staff_read ON rewards;
CREATE POLICY rewards_staff_read ON rewards
FOR SELECT TO authenticated
USING (public.is_active_user());

-- announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_admin_all ON announcements;
CREATE POLICY announcements_admin_all ON announcements
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS announcements_staff_read ON announcements;
CREATE POLICY announcements_staff_read ON announcements
FOR SELECT TO authenticated
USING (public.is_active_user());

-- announcement_reads
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcement_reads_admin_all ON announcement_reads;
CREATE POLICY announcement_reads_admin_all ON announcement_reads
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS announcement_reads_staff_read ON announcement_reads;
CREATE POLICY announcement_reads_staff_read ON announcement_reads
FOR SELECT TO authenticated
USING (public.is_active_user());

-- materialized_view_refresh_log
ALTER TABLE materialized_view_refresh_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS materialized_view_refresh_log_admin_all ON materialized_view_refresh_log;
CREATE POLICY materialized_view_refresh_log_admin_all ON materialized_view_refresh_log
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS materialized_view_refresh_log_staff_read ON materialized_view_refresh_log;
CREATE POLICY materialized_view_refresh_log_staff_read ON materialized_view_refresh_log
FOR SELECT TO authenticated
USING (public.is_active_user());

-- cron_job_log
ALTER TABLE cron_job_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cron_job_log_admin_all ON cron_job_log;
CREATE POLICY cron_job_log_admin_all ON cron_job_log
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS cron_job_log_staff_read ON cron_job_log;
CREATE POLICY cron_job_log_staff_read ON cron_job_log
FOR SELECT TO authenticated
USING (public.is_active_user());

-- email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_queue_admin_all ON email_queue;
CREATE POLICY email_queue_admin_all ON email_queue
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS email_queue_staff_read ON email_queue;
CREATE POLICY email_queue_staff_read ON email_queue
FOR SELECT TO authenticated
USING (public.is_active_user());

-- system_health_checks
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_health_checks_admin_all ON system_health_checks;
CREATE POLICY system_health_checks_admin_all ON system_health_checks
FOR ALL TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS system_health_checks_staff_read ON system_health_checks;
CREATE POLICY system_health_checks_staff_read ON system_health_checks
FOR SELECT TO authenticated
USING (public.is_active_user());

-- current_stock (materialized view) — RLS not applied in bootstrap phase
