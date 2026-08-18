-- Migration 00010: Patient deregistration & Doctor account deletion support
--
-- 1. Adds 'deregistered' to the patients.status CHECK constraint so
--    doctors can soft-deregister patients without losing history.
-- 2. Alters created_by / changed_by foreign-key columns on clinical
--    tables to ON DELETE SET NULL + nullable so that deleting a doctor
--    from auth.users does NOT cascade to patient records. Patient data
--    and audit trails are preserved; the creator column simply becomes
--    NULL after account deletion.

BEGIN;

------------------------------------------------------------
-- 1. Add 'deregistered' to patients.status constraint
------------------------------------------------------------
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE public.patients
  ADD CONSTRAINT patients_status_check
  CHECK (status IN ('active', 'inactive', 'deceased', 'archived', 'deregistered'));

------------------------------------------------------------
-- 2. Make created_by / changed_by FKs SET NULL ON DELETE so
--    deleting a doctor preserves patient records.
--
--    Uses a DO block to iterate every FK from public.* → auth.users
--    where the local column is created_by, changed_by, or assigned_by.
------------------------------------------------------------
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
      AND kcu.column_name   IN ('created_by', 'changed_by', 'assigned_by')
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
      fk.table_name, fk.column_name
    );
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