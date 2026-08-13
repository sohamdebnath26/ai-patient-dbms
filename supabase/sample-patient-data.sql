-- Sample Patient Clinical Data
-- Run this in the Supabase SQL Editor to insert a fully-populated sample patient.
-- The SQL Editor runs with elevated privileges, bypassing RLS.

-- Ensure an organization and clinic exist
INSERT INTO public.organizations (id, name)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Riverdale Medical Center')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clinics (id, organization_id, name)
VALUES ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Clinic')
ON CONFLICT (id) DO NOTHING;

-- Find an existing doctor, or use a fallback UUID
DO $$
DECLARE
  v_org uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_clinic uuid := 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';
  v_doctor uuid;
  v_patient uuid := 'dddddddd-1111-1111-1111-dddddddddddd';
BEGIN
  -- Get any doctor's id from profiles
  SELECT id INTO v_doctor FROM public.profiles WHERE role = 'doctor' LIMIT 1;
  IF v_doctor IS NULL THEN
    v_doctor := '22222222-1111-1111-1111-111111111111';
  END IF;

  -- Patient: David Miller — Type 2 Diabetes + Hypertension
  INSERT INTO public.patients (id, organization_id, clinic_id, first_name, last_name, dob, gender, blood_group, marital_status, occupation, email, phone, address, mrn, status, created_by)
  VALUES (
    v_patient, v_org, v_clinic,
    'David', 'Miller', '1968-09-30', 'Male', 'A-', 'Married', 'Accountant',
    'david.miller@email.com', '555-0201', '42 Elm Street, Springfield',
    'MRN-100', 'active', v_doctor
  )
  ON CONFLICT (id) DO NOTHING;

  -- Allergies
  INSERT INTO public.allergies (patient_id, organization_id, clinic_id, allergen, reaction, severity, status, created_by)
  VALUES
    (v_patient, v_org, v_clinic, 'Penicillin', 'Hives and swelling', 'severe', 'active', v_doctor),
    (v_patient, v_org, v_clinic, 'Sulfa drugs', 'Rash', 'moderate', 'active', v_doctor);

  -- Diagnoses
  INSERT INTO public.diagnoses (patient_id, organization_id, clinic_id, icd10_code, description, diagnosis_type, status, onset_date, created_by)
  VALUES
    (v_patient, v_org, v_clinic, 'E11.9', 'Type 2 diabetes mellitus without complications', 'primary', 'active', '2015-06-01', v_doctor),
    (v_patient, v_org, v_clinic, 'I10', 'Essential (primary) hypertension', 'primary', 'active', '2016-02-15', v_doctor),
    (v_patient, v_org, v_clinic, 'E78.5', 'Hyperlipidemia, unspecified', 'secondary', 'active', '2016-02-15', v_doctor);

  -- Encounters
  INSERT INTO public.encounters (patient_id, organization_id, clinic_id, assigned_to, encounter_date, chief_complaint, findings, plan, status, created_by)
  VALUES
    (v_patient, v_org, v_clinic, v_doctor, '2026-08-10', 'Routine diabetes follow-up; reports increased thirst and fatigue over past month.',
     'Vitals: BP 148/92, HR 82. HbA1c trending up to 8.4% from 7.2%. Fasting glucose 182 mg/dL. Mild peripheral edema noted bilaterally.',
     'Increase metformin to 1000mg BID. Add lisinopril 10mg daily for BP. Recheck HbA1c in 3 months. Refer to nutrition counseling.',
     'completed', v_doctor),
    (v_patient, v_org, v_clinic, v_doctor, '2026-05-12', 'Annual physical; no acute complaints.',
     'Vitals: BP 140/88, HR 76. Weight 92kg. Exam unremarkable.',
     'Continue current medications. Reinforce diet and exercise. Follow up in 3 months.',
     'completed', v_doctor);

  -- Vitals (recent to oldest)
  INSERT INTO public.vitals (patient_id, organization_id, clinic_id, temperature_celsius, heart_rate_bpm, blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate, oxygen_saturation, height_cm, weight_kg, recorded_at, created_by)
  VALUES
    (v_patient, v_org, v_clinic, 36.8, 82, 148, 92, 18, 97, 178.0, 92.0, '2026-08-10 09:30:00+00', v_doctor),
    (v_patient, v_org, v_clinic, 36.6, 76, 140, 88, 16, 98, 178.0, 91.0, '2026-05-12 10:15:00+00', v_doctor),
    (v_patient, v_org, v_clinic, 36.7, 78, 138, 86, 16, 98, 178.0, 90.5, '2026-02-01 09:00:00+00', v_doctor);

  -- Prescriptions
  INSERT INTO public.prescriptions (patient_id, organization_id, clinic_id, status, notes, created_by)
  VALUES
    (v_patient, v_org, v_clinic, 'active', 'Metformin and lisinopril regimen', v_doctor),
    (v_patient, v_org, v_clinic, 'active', 'Statin therapy', v_doctor);

  -- Medical history
  INSERT INTO public.medical_history (patient_id, organization_id, clinic_id, condition, diagnosis_date, status, notes, created_by)
  VALUES
    (v_patient, v_org, v_clinic, 'Type 2 Diabetes', '2015-06-01', 'chronic', 'Poorly controlled; recent HbA1c 8.4%', v_doctor),
    (v_patient, v_org, v_clinic, 'Hypertension', '2016-02-15', 'chronic', 'Stage 1', v_doctor),
    (v_patient, v_org, v_clinic, 'Hyperlipidemia', '2016-02-15', 'chronic', 'Managed with statin', v_doctor);
END;
$$;
