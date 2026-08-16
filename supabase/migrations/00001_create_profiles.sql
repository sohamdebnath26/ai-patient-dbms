-- Migration 00001: User Profiles, Organizations, Clinics, and Roles
-- Creates the foundational user management schema.
--
-- Every successful signup MUST end up with exactly one row in
-- public.profiles for the new auth.users.id. This file:
--   1. Defines the profiles / organizations / clinics / user_roles
--      tables with RLS policies.
--   2. Installs handle_new_user() as the primary path: it fires
--      AFTER INSERT ON auth.users and inserts a profile.
--   3. Wraps the trigger body in an EXCEPTION block so that even if
--      Postgres somehow rejects the INSERT (FK violation, race, missing
--      grants, etc.) the auth.users row stays — the frontend has a
--      client-side fallback (see ProfileService.ensureProfileFor) that
--      will repair the missing profile on the next request.
--   4. Uses ON CONFLICT (id) DO NOTHING so re-firing for the same
--      user is idempotent.

------------------------------------------------------------
-- Organizations
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_select ON public.organizations;
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS organizations_insert ON public.organizations;
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT
  WITH CHECK (TRUE);

------------------------------------------------------------
-- Clinics
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinics_select ON public.clinics;
CREATE POLICY clinics_select ON public.clinics
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS clinics_insert ON public.clinics;
CREATE POLICY clinics_insert ON public.clinics
  FOR INSERT
  WITH CHECK (TRUE);

------------------------------------------------------------
-- Profiles
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  first_name      text NOT NULL DEFAULT '',
  last_name       text NOT NULL DEFAULT '',
  role            text NOT NULL DEFAULT 'doctor'
                  CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient', 'pharmacist')),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  clinic_id       uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles in their organization
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.organization_id = profiles.organization_id
    )
  );

-- Users can update their own profile (except role)
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can update profiles in their organization
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.organization_id = profiles.organization_id
    )
  );

-- Allow insert for the signed-in user on their own profile row.
-- This is the safety-net path: if the trigger is missing/disabled for
-- any reason, the authenticated user can self-insert their profile.
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Upsert path: an authenticated user may insert OR update their own
-- profile row. The frontend uses this for self-repair.
DROP POLICY IF EXISTS profiles_upsert_own ON public.profiles;
CREATE POLICY profiles_upsert_own ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

------------------------------------------------------------
-- Trigger: auto-create profile on signup
--
-- Bulleted:
--   * ON CONFLICT (id) DO NOTHING — re-firing on the same user is
--     a no-op (e.g. trigger was re-installed; user was already
--     back-filled by the client).
--   * Wrapped in BEGIN / EXCEPTION / END so any error (FK violation,
--     RLS denial, missing grants) is captured and the auth.users
--     INSERT is NOT rolled back. The frontend's
--     ProfileService.ensureProfileFor is the fallback for these
--     cases — see migration 00009 for the historical backfill.
--   * Default role is 'doctor' so new signups can immediately use
--     the patient-management flows during development. Change the
--     default in this function (or update rows after signup) to gate
--     access behind an admin-approval workflow in production.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'doctor')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Swallow any failure. The auth.users row must stay. The
      -- frontend ProfileService.ensureProfileFor will create the
      -- profile on the next authenticated request.
      NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

------------------------------------------------------------
-- Trigger: set updated_at on profile update
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

------------------------------------------------------------
-- user_roles (audit table for role assignments)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL
              CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient', 'pharmacist')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS user_roles_insert ON public.user_roles;
CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );