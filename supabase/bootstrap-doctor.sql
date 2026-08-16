-- Bootstrap Doctor
-- One-shot script that promotes a user so they can:
--   1. Read diagnoses + medical_history (CLINICAL RLS gate that requires
--      role IN ('doctor','admin')).
--   2. Insert patients (patients_insert policy requires
--      role IN ('doctor','receptionist')).
--   3. Pass the OrganizationGate, which sources the active org from
--      organization_members (the new authoritative model).
--
-- The SQL Editor runs as `postgres`, so auth.uid() returns NULL there.
-- Edit both WHERE clauses below to the email you actually want to
-- promote, then run this in the SQL Editor.
--
-- This script is self-contained: it creates organization_members (with
-- RLS, indexes, and the is_org_member() helper) if it does not already
-- exist, so it does not depend on having run 00007_organization_members.sql
-- first. It is safe to run multiple times; every step is idempotent.

BEGIN;

------------------------------------------------------------
-- 1. organization_members table (idempotent)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  clinic_id       uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  role            text NOT NULL
                  CHECK (role IN ('admin', 'doctor', 'receptionist', 'pharmacist')),
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'invited', 'suspended')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org
  ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_status
  ON public.organization_members(user_id, status);

-- updated_at trigger (only if the helper function + trigger are missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_organization_members_updated_at'
    ) THEN
      EXECUTE 'CREATE TRIGGER set_organization_members_updated_at
               BEFORE UPDATE ON public.organization_members
               FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
    END IF;
  END IF;
END $$;

------------------------------------------------------------
-- 2. RLS on organization_members (idempotent via pg_policies check)
------------------------------------------------------------
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'organization_members'
      AND policyname = 'organization_members_select_self'
  ) THEN
    CREATE POLICY organization_members_select_self ON public.organization_members
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'organization_members'
      AND policyname = 'organization_members_select_admin'
  ) THEN
    CREATE POLICY organization_members_select_admin ON public.organization_members
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.organization_members AS m
          WHERE m.user_id = auth.uid()
            AND m.role = 'admin'
            AND m.status = 'active'
            AND m.organization_id = organization_members.organization_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'organization_members'
      AND policyname = 'organization_members_admin_write'
  ) THEN
    CREATE POLICY organization_members_admin_write ON public.organization_members
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.organization_members AS m
          WHERE m.user_id = auth.uid()
            AND m.role = 'admin'
            AND m.status = 'active'
            AND m.organization_id = organization_members.organization_id
        )
      )
      WITH CHECK (false);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

------------------------------------------------------------
-- 3. is_org_member() helper (idempotent via CREATE OR REPLACE)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(uid uuid, oid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE  user_id = uid
      AND  organization_id = oid
      AND  status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;

------------------------------------------------------------
-- 4. Promote the chosen account to 'doctor' and bind it to the
--    canonical org the dermatology seed uses.
------------------------------------------------------------
-- 4a) Confirm the account you are about to promote. If you do not see
--     your email here, sign up at /auth/signup first so the
--     handle_new_user trigger creates a profiles row.
-- SELECT id, email, first_name, last_name, role, organization_id
-- FROM   public.profiles
-- ORDER  BY created_at DESC;

UPDATE public.profiles
SET    role            = 'doctor',
       organization_id = COALESCE(organization_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
WHERE  email = 'you@example.com';

------------------------------------------------------------
-- 5. THE critical step that the original bootstrap script was missing.
--    The new auth model reads active memberships from
--    organization_members, not from profiles.organization_id. Without
--    this row, the OrganizationGate renders the 'no memberships' page
--    and the Register Patient form is never shown — even after step 4.
------------------------------------------------------------
INSERT INTO public.organization_members (user_id, organization_id, clinic_id, role, status)
SELECT p.id,
       p.organization_id,
       p.clinic_id,
       'doctor',
       'active'
FROM   public.profiles p
WHERE  p.email = 'you@example.com'
ON CONFLICT (user_id, organization_id) DO NOTHING;

------------------------------------------------------------
-- 6. Verify the change took effect.
------------------------------------------------------------
-- SELECT p.id, p.email, p.role, p.organization_id,
--        m.organization_id AS membership_org, m.role AS membership_role, m.status
-- FROM   public.profiles p
-- LEFT JOIN public.organization_members m ON m.user_id = p.id
-- WHERE  p.email = 'you@example.com';

COMMIT;

-- After running, **sign out and sign back in** in the app so:
--   - the React Query cache for ['organization-memberships'] refetches,
--   - the persisted selected-org store rebuilds, and
--   - the OrganizationGate switches from 'no memberships' to 'ready'.
-- Then /patients/new will render the form and the INSERT will pass RLS.