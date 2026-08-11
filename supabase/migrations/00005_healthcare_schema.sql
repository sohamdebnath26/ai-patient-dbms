-- Migration 00005: Full Healthcare Database Schema
--
-- Entity Relationship Diagram:
-- ```mermaid
-- erDiagram
--   auth_users ||--|| profiles : "1:1"
--   organizations ||--o{ clinics : "has"
--   organizations ||--o{ profiles : "member"
--   profiles }o--|| organizations : "belongs"
--   patients ||--o{ patient_contacts : "has"
--   patients ||--o{ emergency_contacts : "has"
--   patients ||--o{ allergies : "has"
--   patients ||--o{ medical_history : "has"
--   patients ||--o{ appointments : "books"
--   appointments ||--o{ consultations : "results in"
--   patients ||--o{ consultations : "attends"
--   consultations ||--o{ diagnoses : "yields"
--   consultations ||--o{ prescriptions : "generates"
--   prescriptions ||--o{ prescription_items : "contains"
--   patients ||--o{ lab_reports : "has"
--   lab_reports ||--o{ medical_images : "contains"
--   consultations ||--o{ clinical_notes : "documented"
--   consultations ||--o{ vitals : "recorded"
--   profiles ||--o{ patients : "manages"
--   profiles ||--o{ appointments : "creates"
--   profiles ||--o{ consultations : "conducts"
-- ```

------------------------------------------------------------
-- Drop and recreate patients with multi-tenant columns
------------------------------------------------------------
DROP POLICY IF EXISTS patients_delete           ON public.patients;
DROP POLICY IF EXISTS patients_insert           ON public.patients;
DROP POLICY IF EXISTS patients_select           ON public.patients;
DROP POLICY IF EXISTS patients_update_doctor    ON public.patients;
DROP POLICY IF EXISTS patients_update_receptionist ON public.patients;
DROP TRIGGER IF EXISTS set_patients_updated_at  ON public.patients;
DROP TABLE IF EXISTS public.patients CASCADE;

CREATE TABLE public.patients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  dob             date,
  gender          text,
  blood_group     text,
  marital_status  text,
  occupation      text,
  email           text,
  phone           text,
  address         text,
  mrn             text UNIQUE NOT NULL,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'archived')),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_org        ON public.patients(organization_id);
CREATE INDEX idx_patients_clinic     ON public.patients(clinic_id);
CREATE INDEX idx_patients_name       ON public.patients(last_name, first_name);
CREATE INDEX idx_patients_mrn        ON public.patients(mrn);
CREATE INDEX idx_patients_status     ON public.patients(status);
CREATE INDEX idx_patients_created_by ON public.patients(created_by);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY patients_select ON public.patients FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE POLICY patients_insert ON public.patients FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist'));

CREATE POLICY patients_update ON public.patients FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'))
  WITH CHECK (true);

CREATE POLICY patients_delete ON public.patients FOR DELETE
  USING (false);

CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;

------------------------------------------------------------
-- patient_contacts
------------------------------------------------------------
CREATE TABLE public.patient_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  contact_type    text NOT NULL CHECK (contact_type IN ('phone', 'email', 'address', 'other')),
  contact_value   text NOT NULL,
  is_primary      boolean NOT NULL DEFAULT false,
  label           text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_contacts_patient ON public.patient_contacts(patient_id);
CREATE INDEX idx_patient_contacts_org     ON public.patient_contacts(organization_id);

ALTER TABLE public.patient_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_contacts_access ON public.patient_contacts
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE TRIGGER set_patient_contacts_updated_at
  BEFORE UPDATE ON public.patient_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_contacts TO authenticated;

------------------------------------------------------------
-- emergency_contacts
------------------------------------------------------------
CREATE TABLE public.emergency_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  name            text NOT NULL,
  relationship    text NOT NULL,
  phone           text NOT NULL,
  email           text,
  address         text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_contacts_patient ON public.emergency_contacts(patient_id);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_contacts_access ON public.emergency_contacts
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE TRIGGER set_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;

------------------------------------------------------------
-- allergies
------------------------------------------------------------
CREATE TABLE public.allergies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  allergen        text NOT NULL,
  reaction        text NOT NULL,
  severity        text NOT NULL DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  recorded_date   date NOT NULL DEFAULT CURRENT_DATE,
  notes           text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_allergies_patient ON public.allergies(patient_id);

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY allergies_access ON public.allergies
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE TRIGGER set_allergies_updated_at
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies TO authenticated;

------------------------------------------------------------
-- medical_history
------------------------------------------------------------
CREATE TABLE public.medical_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  condition       text NOT NULL,
  diagnosis_date  date,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic', 'in_remission')),
  notes           text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_history_patient ON public.medical_history(patient_id);

ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY medical_history_access ON public.medical_history
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_medical_history_updated_at
  BEFORE UPDATE ON public.medical_history
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.medical_history TO authenticated;

------------------------------------------------------------
-- appointments
------------------------------------------------------------
CREATE TABLE public.appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id        uuid REFERENCES public.clinics(id),
  appointment_date date NOT NULL,
  appointment_time time,
  duration_minutes integer NOT NULL DEFAULT 30,
  type             text NOT NULL DEFAULT 'in_person' CHECK (type IN ('in_person', 'telehealth', 'home_visit')),
  status           text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reason           text,
  notes            text,
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_org     ON public.appointments(organization_id);
CREATE INDEX idx_appointments_date    ON public.appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status  ON public.appointments(status);
CREATE INDEX idx_appointments_creator ON public.appointments(created_by);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_access ON public.appointments
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

------------------------------------------------------------
-- consultations
------------------------------------------------------------
CREATE TABLE public.consultations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id   uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id        uuid REFERENCES public.clinics(id),
  consultation_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint  text,
  findings         text,
  plan             text,
  status           text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_by       uuid NOT NULL REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultations_patient     ON public.consultations(patient_id);
CREATE INDEX idx_consultations_appointment ON public.consultations(appointment_id);
CREATE INDEX idx_consultations_org         ON public.consultations(organization_id);
CREATE INDEX idx_consultations_date        ON public.consultations(consultation_date);
CREATE INDEX idx_consultations_creator     ON public.consultations(created_by);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY consultations_access ON public.consultations
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.consultations TO authenticated;

------------------------------------------------------------
-- diagnoses
------------------------------------------------------------
CREATE TABLE public.diagnoses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  icd10_code      text,
  description     text NOT NULL,
  diagnosis_type  text NOT NULL DEFAULT 'primary' CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic')),
  onset_date      date,
  resolution_date date,
  notes           text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnoses_patient     ON public.diagnoses(patient_id);
CREATE INDEX idx_diagnoses_consultation ON public.diagnoses(consultation_id);
CREATE INDEX idx_diagnoses_org         ON public.diagnoses(organization_id);

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnoses_access ON public.diagnoses
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_diagnoses_updated_at
  BEFORE UPDATE ON public.diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.diagnoses TO authenticated;

------------------------------------------------------------
-- prescriptions
------------------------------------------------------------
CREATE TABLE public.prescriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  notes           text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_patient     ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_consultation ON public.prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_org         ON public.prescriptions(organization_id);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY prescriptions_access ON public.prescriptions
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;

------------------------------------------------------------
-- prescription_items
------------------------------------------------------------
CREATE TABLE public.prescription_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage          text NOT NULL,
  frequency       text NOT NULL,
  duration        text,
  route           text,
  instructions    text,
  quantity        integer,
  refills         integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescription_items_prescription ON public.prescription_items(prescription_id);

ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY prescription_items_access ON public.prescription_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_items.prescription_id
      AND public.get_user_role(auth.uid()) IN ('doctor', 'admin')
  ));

CREATE POLICY prescription_items_insert ON public.prescription_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_items.prescription_id
      AND public.get_user_role(auth.uid()) IN ('doctor', 'admin')
  ));

CREATE TRIGGER set_prescription_items_updated_at
  BEFORE UPDATE ON public.prescription_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.prescription_items TO authenticated;

------------------------------------------------------------
-- lab_reports
------------------------------------------------------------
CREATE TABLE public.lab_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  test_name       text NOT NULL,
  loinc_code      text,
  category        text,
  status          text NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'in_progress', 'completed', 'cancelled')),
  result_summary  text,
  report_date     timestamptz,
  lab_name        text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_reports_patient ON public.lab_reports(patient_id);
CREATE INDEX idx_lab_reports_org     ON public.lab_reports(organization_id);
CREATE INDEX idx_lab_reports_status  ON public.lab_reports(status);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY lab_reports_access ON public.lab_reports
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_lab_reports_updated_at
  BEFORE UPDATE ON public.lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.lab_reports TO authenticated;

------------------------------------------------------------
-- medical_images
------------------------------------------------------------
CREATE TABLE public.medical_images (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  lab_report_id   uuid REFERENCES public.lab_reports(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  image_type      text NOT NULL CHECK (image_type IN ('x_ray', 'mri', 'ct_scan', 'ultrasound', 'other')),
  body_part       text,
  file_path       text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes           text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_images_patient   ON public.medical_images(patient_id);
CREATE INDEX idx_medical_images_lab_report ON public.medical_images(lab_report_id);

ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY medical_images_access ON public.medical_images
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_medical_images_updated_at
  BEFORE UPDATE ON public.medical_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.medical_images TO authenticated;

------------------------------------------------------------
-- clinical_notes
------------------------------------------------------------
CREATE TABLE public.clinical_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  note_type       text NOT NULL DEFAULT 'soap' CHECK (note_type IN ('soap', 'progress', 'discharge', 'procedure', 'referral', 'other')),
  subjective      text,
  objective       text,
  assessment      text,
  plan            text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_notes_patient      ON public.clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_consultation ON public.clinical_notes(consultation_id);
CREATE INDEX idx_clinical_notes_org          ON public.clinical_notes(organization_id);
CREATE INDEX idx_clinical_notes_type         ON public.clinical_notes(note_type);
CREATE INDEX idx_clinical_notes_creator      ON public.clinical_notes(created_by);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinical_notes_access ON public.clinical_notes
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

CREATE TRIGGER set_clinical_notes_updated_at
  BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.clinical_notes TO authenticated;

------------------------------------------------------------
-- vitals
------------------------------------------------------------
CREATE TABLE public.vitals (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id               uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id          uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  organization_id          uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id                uuid REFERENCES public.clinics(id),
  temperature_celsius      numeric(4,1),
  heart_rate_bpm           integer,
  blood_pressure_systolic  integer,
  blood_pressure_diastolic integer,
  respiratory_rate         integer,
  oxygen_saturation        integer,
  height_cm                numeric(5,1),
  weight_kg                numeric(5,1),
  bmi                      numeric(4,1) GENERATED ALWAYS AS (
    CASE WHEN height_cm > 0 THEN weight_kg / ((height_cm / 100) * (height_cm / 100)) END
  ) STORED,
  recorded_at              timestamptz NOT NULL DEFAULT now(),
  created_by               uuid NOT NULL REFERENCES auth.users(id),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vitals_patient      ON public.vitals(patient_id);
CREATE INDEX idx_vitals_consultation ON public.vitals(consultation_id);
CREATE INDEX idx_vitals_org          ON public.vitals(organization_id);
CREATE INDEX idx_vitals_recorded_at  ON public.vitals(recorded_at);

ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY vitals_access ON public.vitals
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE TRIGGER set_vitals_updated_at
  BEFORE UPDATE ON public.vitals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.vitals TO authenticated;