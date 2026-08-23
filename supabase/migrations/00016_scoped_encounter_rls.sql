-- Migration 00016: Scoped encounter & appointment RLS policies
--
-- Replaces broad role-based policies with org-or-creator scoping
-- to prevent cross-user data leakage in personal mode.
--
-- Encounters: scoped by created_by (personal) or organization_id (org)
-- Procedures: scoped via parent encounter
-- Appointments: scoped by created_by (personal) or organization_id (org)
-- Appointment status history: scoped via parent appointment
-- Clinical data (diagnoses, meds, lab reports, notes): scoped via parent encounter
-- Vitals: scoped via parent encounter

BEGIN;

-- Encounters
DROP POLICY IF EXISTS encounters_access ON public.encounters;

CREATE POLICY encounters_access ON public.encounters
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
    AND (
      encounters.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND organization_id = encounters.organization_id
      )
    )
  );

-- Procedures (via parent encounter)
DROP POLICY IF EXISTS procedures_access ON public.procedures;

CREATE POLICY procedures_access ON public.procedures
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'admin')
    AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = procedures.encounter_id
        AND (
          e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id = e.organization_id
          )
        )
    )
  );

-- Appointments
DROP POLICY IF EXISTS appointments_access ON public.appointments;

CREATE POLICY appointments_access ON public.appointments
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
    AND (
      appointments.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND organization_id = appointments.organization_id
      )
    )
  );

-- Appointment status history (via parent appointment)
DROP POLICY IF EXISTS status_history_access ON public.appointment_status_history;

CREATE POLICY status_history_access ON public.appointment_status_history
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_status_history.appointment_id
        AND (
          a.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id = a.organization_id
          )
        )
    )
  );

-- Diagnoses (via parent encounter when encounter_id is set)
DROP POLICY IF EXISTS diagnoses_access ON public.diagnoses;

CREATE POLICY diagnoses_access ON public.diagnoses
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'admin')
    AND (
      diagnoses.encounter_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.encounters e
        WHERE e.id = diagnoses.encounter_id
          AND (
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.organization_id = e.organization_id
            )
          )
      )
    )
  );

-- Prescriptions (via parent encounter when encounter_id is set)
DROP POLICY IF EXISTS prescriptions_access ON public.prescriptions;

CREATE POLICY prescriptions_access ON public.prescriptions
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'admin')
    AND (
      prescriptions.encounter_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.encounters e
        WHERE e.id = prescriptions.encounter_id
          AND (
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.organization_id = e.organization_id
            )
          )
      )
    )
  );

-- Clinical notes (via parent encounter when encounter_id is set)
DROP POLICY IF EXISTS clinical_notes_access ON public.clinical_notes;

CREATE POLICY clinical_notes_access ON public.clinical_notes
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'admin')
    AND (
      clinical_notes.encounter_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.encounters e
        WHERE e.id = clinical_notes.encounter_id
          AND (
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.organization_id = e.organization_id
            )
          )
      )
    )
  );

-- Lab reports (via parent encounter when encounter_id is set)
DROP POLICY IF EXISTS lab_reports_access ON public.lab_reports;

CREATE POLICY lab_reports_access ON public.lab_reports
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'admin')
    AND (
      lab_reports.encounter_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.encounters e
        WHERE e.id = lab_reports.encounter_id
          AND (
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.organization_id = e.organization_id
            )
          )
      )
    )
  );

-- Vitals (via parent encounter when encounter_id is set)
DROP POLICY IF EXISTS vitals_access ON public.vitals;

CREATE POLICY vitals_access ON public.vitals
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
    AND (
      vitals.encounter_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.encounters e
        WHERE e.id = vitals.encounter_id
          AND (
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.organization_id = e.organization_id
            )
          )
      )
    )
  );

COMMIT;