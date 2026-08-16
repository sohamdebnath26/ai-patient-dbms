-- Migration 00008: Organizations are optional
--
-- Doctors must be able to use the application immediately after signup,
-- without being assigned to an organization. This migration makes
-- organization_id nullable on every table that has it, so the
-- application layer can insert with organization_id = NULL and
-- scope reads by created_by = auth.uid() instead.
--
-- The organization_id column is preserved (not dropped) so that users
-- who later join an organization can attach their existing records
-- to it, and so existing seeded data continues to work as-is.
--
-- Idempotency:
--   * Every ALTER runs inside a DO block that first checks
--     information_schema.columns, so the migration skips tables that
--     don't carry organization_id (e.g. prescription_items inherits its
--     org scope via prescription_id and intentionally has no such
--     column).
--   * Every CREATE INDEX uses IF NOT EXISTS.

BEGIN;

------------------------------------------------------------
-- 1. organization_id → nullable on every table that has it
--
-- Each block is guarded: it only alters the column when it exists in
-- information_schema.columns. Tables that never had the column are
-- silently skipped. Re-running the migration is a no-op.
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.patients ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patient_contacts' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.patient_contacts ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'emergency_contacts' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.emergency_contacts ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'allergies' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.allergies ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'medical_history' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.medical_history ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.appointments ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'encounters' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.encounters ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.consultations ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'diagnoses' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.diagnoses ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prescriptions' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.prescriptions ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lab_reports' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.lab_reports ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'medical_images' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.medical_images ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_notes' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.clinical_notes ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vitals' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.vitals ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

-- NOTE: prescription_items is intentionally NOT included. Its org
-- scope is inherited via prescription_id → prescriptions.organization_id.
-- Adding organization_id to prescription_items would create a
-- denormalization that is never used.

------------------------------------------------------------
-- 2. created_by indexes (only on tables that carry the column)
------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_created_by
  ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by
  ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_encounters_created_by
  ON public.encounters(created_by);

COMMIT;