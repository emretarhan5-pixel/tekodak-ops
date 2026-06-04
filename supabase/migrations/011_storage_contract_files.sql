-- TEKODAK OPS — 011_storage_contract_files.sql
-- Private bucket for contract documents (10 MB). Path: {contract_id}/{file_id}/{filename}
-- Run in Supabase SQL Editor if not using CLI migrate.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('contract-files', 'contract-files', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE OR REPLACE FUNCTION public.storage_path_contract_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
BEGIN
  parts := string_to_array(object_name, '/');
  IF array_length(parts, 1) < 1 OR parts[1] IS NULL OR parts[1] = '' THEN
    RETURN NULL;
  END IF;
  RETURN parts[1]::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.contract_in_staff_branch(p_contract_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM contracts c
    WHERE c.id = p_contract_id
      AND c.deleted_at IS NULL
      AND c.branch_id = public.user_branch_id()
  );
$$;

DROP POLICY IF EXISTS contract_files_storage_select ON storage.objects;
CREATE POLICY contract_files_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contract-files'
  AND (
    public.is_admin_user()
    OR public.contract_in_staff_branch(public.storage_path_contract_id(name))
  )
);

DROP POLICY IF EXISTS contract_files_storage_insert ON storage.objects;
CREATE POLICY contract_files_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contract-files'
  AND (
    public.is_admin_user()
    OR public.contract_in_staff_branch(public.storage_path_contract_id(name))
  )
);

DROP POLICY IF EXISTS contract_files_storage_update ON storage.objects;
CREATE POLICY contract_files_storage_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'contract-files'
  AND (
    public.is_admin_user()
    OR public.contract_in_staff_branch(public.storage_path_contract_id(name))
  )
)
WITH CHECK (
  bucket_id = 'contract-files'
  AND (
    public.is_admin_user()
    OR public.contract_in_staff_branch(public.storage_path_contract_id(name))
  )
);

DROP POLICY IF EXISTS contract_files_storage_delete ON storage.objects;
CREATE POLICY contract_files_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contract-files'
  AND public.is_admin_user()
);

DROP POLICY IF EXISTS contract_files_staff_read ON contract_files;

DROP POLICY IF EXISTS contract_files_staff_select ON contract_files;
CREATE POLICY contract_files_staff_select ON contract_files
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND deleted_at IS NULL
  AND public.contract_in_staff_branch(contract_id)
);

DROP POLICY IF EXISTS contract_files_staff_insert ON contract_files;
CREATE POLICY contract_files_staff_insert ON contract_files
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.contract_in_staff_branch(contract_id)
);

DROP POLICY IF EXISTS contract_files_staff_update ON contract_files;
CREATE POLICY contract_files_staff_update ON contract_files
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.contract_in_staff_branch(contract_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.contract_in_staff_branch(contract_id)
);
