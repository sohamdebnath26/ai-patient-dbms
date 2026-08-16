-- Bootstrap Doctor
-- One-shot script that promotes a user so they can:
--   1. Read diagnoses + medical_history (CLINICAL RLS gate that requires
--      role IN ('doctor','admin')).
--   2. Insert patients (patients_insert policy requires
--      role IN ('doctor','receptionist')).
--   3. Pass the OrganizationGate, which sources the active org from
--      organization_members (the new authoritative model).
--
-- The Supabase SQL Editor runs as `postgres`, so auth.uid() returns
-- NULL there. Edit both WHERE clauses below to the email you actually
-- want to promote, then run this in the SQL Editor.

BEGIN;

-- 1) Confirm the account you are about to promote.
--    If you do not see your email here, sign up at /auth/signup first
--    so the handle_new_user trigger creates a profiles row.
-- SELECT id, email, first_name, last_name, role, organization_id
-- FROM   public.profiles
-- ORDER  BY created_at DESC;

-- 2) Promote the chosen account to 'doctor' and bind it to the
--    canonical org the dermatology seed uses.
UPDATE public.profiles
SET    role            = 'doctor',
       organization_id = COALESCE(organization_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
WHERE  email = 'you@example.com';

-- 3) THE CRITICAL STEP the original bootstrap script was missing.
--    The new auth model reads active memberships from
--    organization_members, not from profiles.organization_id. Without
--    this row, the OrganizationGate renders the 'no memberships' page
--    and the Register Patient form is never shown — even after step 2.
INSERT INTO public.organization_members (user_id, organization_id, clinic_id, role, status)
SELECT p.id,
       p.organization_id,
       p.clinic_id,
       'doctor',
       'active'
FROM   public.profiles p
WHERE  p.email = 'you@example.com'
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 4) Verify the change took effect.
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