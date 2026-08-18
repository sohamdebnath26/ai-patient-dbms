-- Migration 00011: Dermatology EMR fields
--
-- Adds comprehensive EMR fields to patients for dermatology-specific
-- clinical data, address breakdown, emergency contacts, and medical
-- alerts. Also adds medication detail fields to prescription_items.
--
-- All new columns are nullable to preserve backward compatibility
-- with existing rows.

BEGIN;

------------------------------------------------------------
-- 1. Address breakdown (Section 3 — Contact Information)
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS postal_code text;

------------------------------------------------------------
-- 2. Emergency contact (Section 3)
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;

------------------------------------------------------------
-- 3. Medical alerts — chronic conditions (Section 4)
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS chronic_conditions text;

------------------------------------------------------------
-- 4. Dermatology clinical data (Section 5)
------------------------------------------------------------
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS primary_diagnosis text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS secondary_diagnosis text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS skin_type text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS affected_body_areas text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS disease_severity text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS current_flare boolean;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_history text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS previous_skin_cancer boolean;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS current_treatment text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_notes text;

------------------------------------------------------------
-- 5. Medication detail fields (Section 6)
------------------------------------------------------------
ALTER TABLE public.prescription_items ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.prescription_items ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.prescription_items ADD COLUMN IF NOT EXISTS prescribing_doctor text;

COMMIT;