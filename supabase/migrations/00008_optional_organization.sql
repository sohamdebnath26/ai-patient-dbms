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

ALTER TABLE public.patients       ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.appointments   ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.encounters     ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.consultations  ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.diagnoses      ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.allergies      ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.medical_history ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.vitals         ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.prescriptions  ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.prescription_items ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.lab_reports    ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.medical_images ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.clinical_notes ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.patient_contacts ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.emergency_contacts ALTER COLUMN organization_id DROP NOT NULL;

-- A row counts as either org-scoped or user-owned. The application
-- layer filters by organization_id when set, and by created_by when
-- not. These two indexes keep both query paths fast.
CREATE INDEX IF NOT EXISTS idx_patients_created_by
  ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by
  ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_encounters_created_by
  ON public.encounters(created_by);