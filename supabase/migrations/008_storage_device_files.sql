-- TEKODAK OPS — 008_storage_device_files.sql
-- Private bucket for device documents (10 MB). Path: {device_id}/{file_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('device-files', 'device-files', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE OR REPLACE FUNCTION public.storage_path_device_id(object_name text)
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

CREATE OR REPLACE FUNCTION public.device_in_staff_branch(p_device_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM devices d
    INNER JOIN customers c ON c.id = d.customer_id
    WHERE d.id = p_device_id
      AND d.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND c.branch_id = public.user_branch_id()
  );
$$;

DROP POLICY IF EXISTS device_files_storage_select ON storage.objects;
CREATE POLICY device_files_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'device-files'
  AND (
    public.is_admin_user()
    OR public.device_in_staff_branch(public.storage_path_device_id(name))
  )
);

DROP POLICY IF EXISTS device_files_storage_insert ON storage.objects;
CREATE POLICY device_files_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'device-files'
  AND (
    public.is_admin_user()
    OR public.device_in_staff_branch(public.storage_path_device_id(name))
  )
);

DROP POLICY IF EXISTS device_files_storage_update ON storage.objects;
CREATE POLICY device_files_storage_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'device-files'
  AND (
    public.is_admin_user()
    OR public.device_in_staff_branch(public.storage_path_device_id(name))
  )
)
WITH CHECK (
  bucket_id = 'device-files'
  AND (
    public.is_admin_user()
    OR public.device_in_staff_branch(public.storage_path_device_id(name))
  )
);

DROP POLICY IF EXISTS device_files_storage_delete ON storage.objects;
CREATE POLICY device_files_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'device-files'
  AND public.is_admin_user()
);

-- device_files: branch-scoped staff write (admin policies unchanged)
DROP POLICY IF EXISTS device_files_staff_read ON device_files;

DROP POLICY IF EXISTS device_files_staff_select ON device_files;
CREATE POLICY device_files_staff_select ON device_files
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND deleted_at IS NULL
  AND public.device_in_staff_branch(device_id)
);

DROP POLICY IF EXISTS device_files_staff_insert ON device_files;
CREATE POLICY device_files_staff_insert ON device_files
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.device_in_staff_branch(device_id)
);

DROP POLICY IF EXISTS device_files_staff_update ON device_files;
CREATE POLICY device_files_staff_update ON device_files
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.device_in_staff_branch(device_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.device_in_staff_branch(device_id)
);
