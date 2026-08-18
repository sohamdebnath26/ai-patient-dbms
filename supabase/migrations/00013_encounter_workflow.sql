-- Migration 00013: Encounter workflow expansion
--
-- Expands encounters into a full clinical encounter record with
-- physical examination, procedures, and encounter-scoped sub-entities.
--
-- Tables reused (NOT recreated):
--   * diagnoses, prescriptions, clinical_notes, vitals, lab_reports
--     → encounter_id FK added so sub-entities are scoped to a
--       specific encounter.
--   * allergies, medical_history, medical_images → unchanged
--     (already linked via patient_id / lab_report_id).
--
-- New:
--   * procedures table for cryotherapy, biopsy, excision, etc.
--   * Encounter-level physical examination fields.
--   * Follow-up planning fields.
--   * Encounter numbering.

BEGIN;

------------------------------------------------------------
-- 1. Expand encounters table with clinical fields
------------------------------------------------------------
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS encounter_number text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS present_illness text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS duration_ text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS symptoms text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS associated_symptoms text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS general_examination text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS local_skin_examination text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS body_site text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS lesion_description text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS morphology text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS distribution text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS borders text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS texture text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS scaling text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS pigmentation text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS tenderness text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS temperature text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS follow_up_date date;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS follow_up_advice text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS follow_up_warnings text;
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS follow_up_lifestyle_advice text;

------------------------------------------------------------
-- 2. Procedures table
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.procedures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  procedure_type  text NOT NULL CHECK (procedure_type IN ('cryotherapy','biopsy','excision','laser','chemical_peel','electrocautery','other')),
  body_site       text,
  notes           text,
  performed_date  date,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procedures_encounter ON public.procedures(encounter_id);
CREATE INDEX IF NOT EXISTS idx_procedures_patient   ON public.procedures(patient_id);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY procedures_access ON public.procedures
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.procedures TO authenticated;

------------------------------------------------------------
-- 3. Link sub-entities to encounters
------------------------------------------------------------
ALTER TABLE public.diagnoses       ADD COLUMN IF NOT EXISTS encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL;
ALTER TABLE public.prescriptions   ADD COLUMN IF NOT EXISTS encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL;
ALTER TABLE public.clinical_notes  ADD COLUMN IF NOT EXISTS encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL;
ALTER TABLE public.vitals          ADD COLUMN IF NOT EXISTS encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL;
ALTER TABLE public.lab_reports     ADD COLUMN IF NOT EXISTS encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL;

-- Diagnosis severity (mild / moderate / severe)
ALTER TABLE public.diagnoses ADD COLUMN IF NOT EXISTS severity text;

CREATE INDEX IF NOT EXISTS idx_diagnoses_encounter       ON public.diagnoses(encounter_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter   ON public.prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_encounter  ON public.clinical_notes(encounter_id);
CREATE INDEX IF NOT EXISTS idx_vitals_encounter          ON public.vitals(encounter_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_encounter     ON public.lab_reports(encounter_id);

COMMIT;