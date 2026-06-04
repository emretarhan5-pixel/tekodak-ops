-- TEKODAK OPS — 007_storage_customer_files.sql
-- Private bucket for customer documents (10 MB). Path: {customer_id}/{file_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('customer-files', 'customer-files', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE OR REPLACE FUNCTION public.storage_path_customer_id(object_name text)
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

DROP POLICY IF EXISTS customer_files_storage_select ON storage.objects;
CREATE POLICY customer_files_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'customer-files'
  AND (
    public.is_admin_user()
    OR public.customer_in_staff_branch(public.storage_path_customer_id(name))
  )
);

DROP POLICY IF EXISTS customer_files_storage_insert ON storage.objects;
CREATE POLICY customer_files_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'customer-files'
  AND (
    public.is_admin_user()
    OR public.customer_in_staff_branch(public.storage_path_customer_id(name))
  )
);

DROP POLICY IF EXISTS customer_files_storage_update ON storage.objects;
CREATE POLICY customer_files_storage_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'customer-files'
  AND (
    public.is_admin_user()
    OR public.customer_in_staff_branch(public.storage_path_customer_id(name))
  )
)
WITH CHECK (
  bucket_id = 'customer-files'
  AND (
    public.is_admin_user()
    OR public.customer_in_staff_branch(public.storage_path_customer_id(name))
  )
);

DROP POLICY IF EXISTS customer_files_storage_delete ON storage.objects;
CREATE POLICY customer_files_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'customer-files'
  AND public.is_admin_user()
);
