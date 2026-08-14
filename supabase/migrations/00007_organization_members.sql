-- Migration 00007: organization_members
--
-- Replaces profiles.organization_id as the source of truth for which
-- organizations a user belongs to. A single auth.users UUID can now
-- belong to many organizations with per-org roles. The application
-- resolves the "currently selected organization" client-side and passes
-- it down through AuthorizationContext.

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

DROP TRIGGER IF EXISTS set_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER set_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- A user can read their own memberships; admins can read all memberships
-- in their organization.
CREATE POLICY organization_members_select_self ON public.organization_members
  FOR SELECT
  USING (auth.uid() = user_id);

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

-- Writes are admin-only (the user's own role on their memberships cannot
-- be self-promoted). The SQL Editor / service-role path bypasses RLS.
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

------------------------------------------------------------
-- Backfill from profiles.organization_id so existing rows keep working
-- after the deploy. Existing profile rows with an organization_id become
-- a single 'active' membership at the same role as the profile row.
-- profiles.organization_id and profiles.clinic_id are intentionally
-- preserved so the legacy single-org read paths keep functioning
-- until the application layer migrates fully to memberships.
------------------------------------------------------------
INSERT INTO public.organization_members (user_id, organization_id, clinic_id, role, status)
SELECT p.id,
       p.organization_id,
       p.clinic_id,
       CASE p.role
         WHEN 'patient' THEN 'doctor'::text  -- patient has no org role; fall back to doctor if present
         ELSE p.role
       END,
       'active'
FROM   public.profiles p
WHERE  p.organization_id IS NOT NULL
  AND  NOT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.user_id = p.id AND m.organization_id = p.organization_id
  );

------------------------------------------------------------
-- Helper: is the current auth user an active member of the given org?
-- Used by future RLS policies that need to scope by selected org.
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