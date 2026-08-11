-- Migration 00006: Encounters & Appointment Status History
--
-- Adds:
-- 1. assigned_to column to appointments (doctor assignment)
-- 2. encounters table (visit/encounter tracking)
-- 3. appointment_status_history table (audit trail)

------------------------------------------------------------
-- Add doctor assignment to appointments
------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON public.appointments(assigned_to);

------------------------------------------------------------
-- Encounters (Visits)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.encounters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id  uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clinic_id       uuid REFERENCES public.clinics(id),
  assigned_to     uuid REFERENCES auth.users(id),
  encounter_date  date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint text,
  findings        text,
  plan            text,
  status          text NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at      timestamptz,
  completed_at    timestamptz,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_encounters_patient     ON public.encounters(patient_id);
CREATE INDEX idx_encounters_appointment ON public.encounters(appointment_id);
CREATE INDEX idx_encounters_org         ON public.encounters(organization_id);
CREATE INDEX idx_encounters_date        ON public.encounters(encounter_date);
CREATE INDEX idx_encounters_assigned    ON public.encounters(assigned_to);
CREATE INDEX idx_encounters_status      ON public.encounters(status);

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY encounters_access ON public.encounters
  FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

CREATE TRIGGER set_encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.encounters TO authenticated;

------------------------------------------------------------
-- Appointment Status History (audit trail)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id   uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  previous_status  text,
  new_status       text NOT NULL,
  changed_by       uuid NOT NULL REFERENCES auth.users(id),
  changed_at       timestamptz NOT NULL DEFAULT now(),
  notes            text
);

CREATE INDEX idx_status_history_appointment ON public.appointment_status_history(appointment_id);

ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY status_history_access ON public.appointment_status_history
  FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin'));

GRANT SELECT, INSERT ON public.appointment_status_history TO authenticated;