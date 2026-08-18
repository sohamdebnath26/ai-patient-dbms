-- Migration 00012: Additional dermatology clinical fields
--
-- Adds the remaining clinical fields requested for the Dermatology EMR.
-- All new columns are nullable to preserve backward compatibility.
--
-- Fields already present elsewhere are NOT duplicated:
--   * Drug / Food / Latex allergies  -> public.allergies
--   * Current medications            -> public.prescriptions / prescription_items
--   * Current diagnosis              -> patients.primary_diagnosis
--   * Current treatment              -> patients.current_treatment (reused as treatment plan)
--   * Previous skin cancer           -> patients.previous_skin_cancer (boolean)
--   * Last visit / next follow-up / total visits -> public.appointments (derived)
--   * Assigned doctor                -> public.profiles (derived)
--   * Prescription available         -> derived from prescriptions
--   * Report generated               -> derived from lab_reports

BEGIN;

------------------------------------------------------------
-- Medical History
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS chief_complaint text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS present_illness text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS previous_skin_diseases text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS previous_surgeries text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS other_medical_conditions text;

------------------------------------------------------------
-- Family History (granular; generic family_history is retained as legacy)
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_history_skin text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_history_cancer text;

------------------------------------------------------------
-- Lifestyle & patient-specific
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS smoking_status text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS alcohol_consumption text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS pregnancy_status text;

------------------------------------------------------------
-- Dermatology assessment
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_onset date;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS symptoms text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS sun_exposure_history text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS cosmetic_product_usage text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS occupational_exposure text;

COMMIT;