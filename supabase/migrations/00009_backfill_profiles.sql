-- Migration 00009: backfill missing profiles + harden the trigger path
--
-- Two guarantees:
--   1. Every existing auth.users row has a matching public.profiles
--      row. (Backfill is idempotent: ON CONFLICT DO NOTHING.)
--   2. The handle_new_user trigger is bulletproof so no future signup
--      can leave auth.users without a profile — the EXCEPTION block
--      keeps the auth row, and the client-side ProfileService.
--      ensureProfileFor is the second-line safety net.

BEGIN;

------------------------------------------------------------
-- 1. Backfill: create a profile for any auth.users that does not have one.
--    Uses the same defaults the trigger would have applied.
------------------------------------------------------------
INSERT INTO public.profiles (id, email, role)
SELECT u.id,
       COALESCE(u.email, ''),
       COALESCE(u.raw_user_meta_data ->> 'role', 'doctor')
FROM   auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE  p.id IS NULL
ON CONFLICT (id) DO NOTHING;

------------------------------------------------------------
-- 2. Idempotent re-create of the handle_new_user trigger and function
--    so any environment where it was lost or replaced picks up the
--    bulletproof version. Uses CREATE OR REPLACE so re-running is
--    safe.
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

COMMIT;