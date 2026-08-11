-- Migration 00004: Patient Management & Default Role Change
--
-- Changes:
-- 1. Update trigger to default new signups to "doctor" role
-- 2. Create patients table for non-auth patient records
-- 3. RLS policies for doctor/receptionist access to patients

------------------------------------------------------------
-- Change default signup role from "patient" to "doctor"
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'doctor')
  );
  RETURN NEW;
END;
$$;

------------------------------------------------------------
-- Patients Table
-- Stores patient records. Patients do NOT authenticate.
-- They exist only as records managed by doctors/receptionists.
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  dob         date,
  gender      text,
  email       text,
  phone       text,
  address     text,
  mrn         text UNIQUE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- RLS: Doctors and receptionists can view patients
------------------------------------------------------------
CREATE POLICY patients_select ON public.patients
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
  );

------------------------------------------------------------
-- RLS: Doctors and receptionists can create patients
------------------------------------------------------------
CREATE POLICY patients_insert ON public.patients
  FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('doctor', 'receptionist')
  );

------------------------------------------------------------
-- RLS: Doctors can update any field on any patient
------------------------------------------------------------
CREATE POLICY patients_update_doctor ON public.patients
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'doctor')
  WITH CHECK (true);

------------------------------------------------------------
-- RLS: Receptionists can update patients
-- Field-level restriction (demographics only) enforced at application layer
------------------------------------------------------------
CREATE POLICY patients_update_receptionist ON public.patients
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'receptionist')
  WITH CHECK (true);

------------------------------------------------------------
-- RLS: Prevent deletion of patients
------------------------------------------------------------
CREATE POLICY patients_delete ON public.patients
  FOR DELETE
  USING (false);

------------------------------------------------------------
-- Trigger: set updated_at on patient update
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_patient_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_patient_updated_at();

------------------------------------------------------------
-- Grant privileges on patients table
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;