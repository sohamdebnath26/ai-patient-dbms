-- Migration 00003: Grant minimum required privileges to authenticated role
--
-- Root cause of "permission denied for table profiles":
-- The original migration created tables and RLS policies but never ran
-- GRANT statements. In PostgreSQL, even with RLS enabled, the role must
-- have basic table privileges (SELECT, INSERT, UPDATE) before RLS policies
-- are evaluated. Without GRANT, every query returns "permission denied"
-- regardless of policy rules.
--
-- This migration grants the minimum privileges each role needs.

------------------------------------------------------------
-- Grant authenticated role privileges on all user-facing tables
------------------------------------------------------------

-- Profiles: authenticated users can read, insert, update (delete is policy-denied)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Organizations: authenticated users can read, insert
GRANT SELECT, INSERT ON public.organizations TO authenticated;

-- Clinics: authenticated users can read, insert
GRANT SELECT, INSERT ON public.clinics TO authenticated;

-- user_roles: authenticated users can read; admin inserts (gated by RLS)
GRANT SELECT, INSERT ON public.user_roles TO authenticated;

------------------------------------------------------------
-- Ensure anon (unauthenticated) has no table access
------------------------------------------------------------
REVOKE ALL ON public.profiles      FROM anon;
REVOKE ALL ON public.organizations FROM anon;
REVOKE ALL ON public.clinics       FROM anon;
REVOKE ALL ON public.user_roles    FROM anon;

------------------------------------------------------------
-- Grant usage on the get_user_role function to authenticated
------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;