-- TEKODAK OPS — 023_storage_service_request_photos.sql
-- Private bucket: service-request-photos (10 MB).
-- Path: {service_request_id}/{step}/{photo_id}/{filename}
--
-- Bucket'ı Supabase Dashboard'dan da oluşturabilirsiniz; bu migration
-- yoksa ekler, varsa limitleri günceller.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('service-request-photos', 'service-request-photos', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE OR REPLACE FUNCTION public.storage_path_service_request_id(object_name text)
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

-- SELECT: şube geneli görüntüleme
DROP POLICY IF EXISTS service_request_photos_storage_select ON storage.objects;
CREATE POLICY service_request_photos_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'service-request-photos'
  AND (
    public.is_admin_user()
    OR public.service_request_in_staff_branch(
      public.storage_path_service_request_id(name)
    )
  )
);

-- INSERT: atanan teknisyen veya admin
DROP POLICY IF EXISTS service_request_photos_storage_insert ON storage.objects;
CREATE POLICY service_request_photos_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-request-photos'
  AND (
    public.is_admin_user()
    OR public.service_request_editable_by_current_user(
      public.storage_path_service_request_id(name)
    )
  )
);

-- UPDATE: atanan teknisyen veya admin
DROP POLICY IF EXISTS service_request_photos_storage_update ON storage.objects;
CREATE POLICY service_request_photos_storage_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'service-request-photos'
  AND (
    public.is_admin_user()
    OR public.service_request_editable_by_current_user(
      public.storage_path_service_request_id(name)
    )
  )
)
WITH CHECK (
  bucket_id = 'service-request-photos'
  AND (
    public.is_admin_user()
    OR public.service_request_editable_by_current_user(
      public.storage_path_service_request_id(name)
    )
  )
);

-- DELETE: yalnızca admin (dosya kaydı uygulama katmanında silinir)
DROP POLICY IF EXISTS service_request_photos_storage_delete ON storage.objects;
CREATE POLICY service_request_photos_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'service-request-photos'
  AND public.is_admin_user()
);
