-- TEKODAK OPS — 006_customers_rls_branch.sql
-- Staff: branch-scoped read/write on customer tables. Admin policies unchanged.

CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'staff'
      AND is_active = TRUE
      AND branch_id IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.user_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM users
  WHERE id = auth.uid()
    AND role = 'staff'
    AND is_active = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.customer_in_staff_branch(p_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = p_customer_id
      AND c.branch_id = public.user_branch_id()
      AND c.deleted_at IS NULL
  );
$$;

-- customers: replace staff read-only with branch-scoped policies
DROP POLICY IF EXISTS customers_staff_read ON customers;

DROP POLICY IF EXISTS customers_staff_select ON customers;
CREATE POLICY customers_staff_select ON customers
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS customers_staff_insert ON customers;
CREATE POLICY customers_staff_insert ON customers
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

DROP POLICY IF EXISTS customers_staff_update ON customers;
CREATE POLICY customers_staff_update ON customers
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
  AND deleted_at IS NULL
)
WITH CHECK (
  public.is_staff_user()
  AND branch_id = public.user_branch_id()
);

-- customer_contacts
DROP POLICY IF EXISTS customer_contacts_staff_read ON customer_contacts;

DROP POLICY IF EXISTS customer_contacts_staff_select ON customer_contacts;
CREATE POLICY customer_contacts_staff_select ON customer_contacts
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_contacts_staff_insert ON customer_contacts;
CREATE POLICY customer_contacts_staff_insert ON customer_contacts
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_contacts_staff_update ON customer_contacts;
CREATE POLICY customer_contacts_staff_update ON customer_contacts
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_contacts_staff_delete ON customer_contacts;
CREATE POLICY customer_contacts_staff_delete ON customer_contacts
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

-- customer_responsible_users
DROP POLICY IF EXISTS customer_responsible_users_staff_read ON customer_responsible_users;

DROP POLICY IF EXISTS customer_responsible_users_staff_select ON customer_responsible_users;
CREATE POLICY customer_responsible_users_staff_select ON customer_responsible_users
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_responsible_users_staff_insert ON customer_responsible_users;
CREATE POLICY customer_responsible_users_staff_insert ON customer_responsible_users
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_responsible_users_staff_update ON customer_responsible_users;
CREATE POLICY customer_responsible_users_staff_update ON customer_responsible_users
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_responsible_users_staff_delete ON customer_responsible_users;
CREATE POLICY customer_responsible_users_staff_delete ON customer_responsible_users
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

-- customer_pins (own rows, customer in branch)
DROP POLICY IF EXISTS customer_pins_staff_read ON customer_pins;

DROP POLICY IF EXISTS customer_pins_staff_select ON customer_pins;
CREATE POLICY customer_pins_staff_select ON customer_pins
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND user_id = auth.uid()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_pins_staff_insert ON customer_pins;
CREATE POLICY customer_pins_staff_insert ON customer_pins
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND user_id = auth.uid()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_pins_staff_delete ON customer_pins;
CREATE POLICY customer_pins_staff_delete ON customer_pins
FOR DELETE TO authenticated
USING (
  public.is_staff_user()
  AND user_id = auth.uid()
  AND public.customer_in_staff_branch(customer_id)
);

-- customer_files
DROP POLICY IF EXISTS customer_files_staff_read ON customer_files;

DROP POLICY IF EXISTS customer_files_staff_select ON customer_files;
CREATE POLICY customer_files_staff_select ON customer_files
FOR SELECT TO authenticated
USING (
  public.is_staff_user()
  AND deleted_at IS NULL
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_files_staff_insert ON customer_files;
CREATE POLICY customer_files_staff_insert ON customer_files
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);

DROP POLICY IF EXISTS customer_files_staff_update ON customer_files;
CREATE POLICY customer_files_staff_update ON customer_files
FOR UPDATE TO authenticated
USING (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
)
WITH CHECK (
  public.is_staff_user()
  AND public.customer_in_staff_branch(customer_id)
);
