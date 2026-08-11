-- Migration 00002: Fix recursive RLS policies on profiles
--
-- Root cause: The profiles_select_admin and profiles_update_admin policies
-- referenced the profiles table in subqueries (e.g., SELECT FROM profiles
-- WHERE id = auth.uid()), causing infinite recursion — the policy triggered
-- itself while evaluating its own condition.
--
-- Fix: Use a SECURITY DEFINER helper function to read user role without
-- triggering RLS. Security definer functions execute with the privileges of
-- the function owner, bypassing RLS on referenced tables.

------------------------------------------------------------
-- Drop the recursive policies
------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own    ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin  ON public.profiles;

------------------------------------------------------------
-- SECURITY DEFINER helper function
-- Bypasses RLS to read a user's role without recursion
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = uid;
  RETURN user_role;
END;
$$;

------------------------------------------------------------
-- Replace profiles_update_own with a non-recursive version
-- Uses auth.uid() directly instead of subquerying profiles
------------------------------------------------------------
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

------------------------------------------------------------
-- Replace profiles_select_admin with helper function
-- Admins can read all profiles (no organization scoping for now)
------------------------------------------------------------
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

------------------------------------------------------------
-- Replace profiles_update_admin with helper function
------------------------------------------------------------
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

------------------------------------------------------------
-- Also fix recursive policies on user_roles that query profiles
------------------------------------------------------------
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert ON public.user_roles;

CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY user_roles_insert ON public.user_roles
  FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');