-- Migration 00017: Appointment ↔ Encounter synchronization constraints
--
-- 1. Enforce at most one encounter per appointment via a partial
--    unique index, so duplicate encounters cannot be created for the
--    same appointment (defense in depth alongside the repository guard).
--    Any pre-existing duplicate encounters are soft-cancelled (kept,
--    not deleted) to preserve clinical history.
--
-- 2. Make assigned_to foreign keys (appointments, encounters) behave
--    like created_by: ON DELETE SET NULL. Deleting a doctor must not
--    block or break appointment/encounter records — the assignment
--    simply becomes NULL.

BEGIN;

-- 1. Deduplicate pre-existing encounters per appointment (keep the
--    earliest, soft-cancel the rest) so the unique index can be built.
UPDATE public.encounters e
SET status = 'cancelled'
WHERE e.appointment_id IS NOT NULL
  AND e.id NOT IN (
    SELECT MIN(id)
    FROM public.encounters
    WHERE appointment_id IS NOT NULL
    GROUP BY appointment_id
  );

-- 2. Partial unique index: one encounter per appointment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_appointment_unique
  ON public.encounters(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- 3. assigned_to FKs → ON DELETE SET NULL.
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name  = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name   = kcu.table_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name  = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type  = 'FOREIGN KEY'
      AND tc.table_schema   = 'public'
      AND ccu.table_schema  = 'auth'
      AND ccu.table_name    = 'users'
      AND ccu.column_name   = 'id'
      AND kcu.column_name   = 'assigned_to'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      fk.table_name, fk.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
      fk.table_name, fk.constraint_name, fk.column_name
    );
  END LOOP;
END $$;

COMMIT;
