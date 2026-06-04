-- TEKODAK OPS — 010_contracts_currency.sql
-- Run manually in Supabase SQL Editor if not using CLI migrate.

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TRY'
  CHECK (currency IN ('TRY', 'EUR'));

COMMENT ON COLUMN contracts.currency IS 'Sözleşme para birimi: TRY veya EUR';
