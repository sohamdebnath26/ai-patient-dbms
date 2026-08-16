-- Auto-promote Doctor (personal mode)
--
-- Minimal one-shot for the new "organizations are optional" world.
-- Promotes a profile to role = 'doctor' so the clinical RLS policies
-- (patients_insert, medical_history, diagnoses) admit the user.
-- Does NOT touch organization_id or create an organization_members
-- row — the user stays in personal mode and scopes data by
-- created_by = auth.uid().
--
-- Run once in the Supabase SQL Editor, replacing the email below.

BEGIN;

UPDATE public.profiles
SET    role = 'doctor'
WHERE  email = 'you@example.com';

COMMIT;

-- Verify:
-- SELECT id, email, role, organization_id
-- FROM   public.profiles
-- WHERE  email = 'you@example.com';