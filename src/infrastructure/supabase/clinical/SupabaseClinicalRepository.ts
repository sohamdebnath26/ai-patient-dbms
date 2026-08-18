import type { IClinicalRepository } from "@application/ports/IClinicalRepository";
import type {
  Medication,
  MedicationInput,
  AllergyInput,
  MedicalHistoryInput,
  LabReportInput,
  ClinicalNote,
  ClinicalNoteInput,
  LabReport,
  MedicalAlert,
  AppointmentSummary,
  AuthorizationContext,
} from "@domain/patient";
import { getSupabaseClient } from "../client";

interface MedicationItemRow {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  start_date: string | null;
  end_date: string | null;
  prescribing_doctor: string | null;
  instructions: string | null;
}

interface PrescriptionRow {
  id: string;
  prescription_items: MedicationItemRow[] | null;
}

interface AllergyRow {
  id: string;
  allergen: string;
  reaction: string;
  severity: string;
  status: string;
}

interface HistoryRow {
  id: string;
  condition: string;
  status: string;
}

interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string | null;
  status: string;
  type: string;
}

interface LabReportRow {
  id: string;
  test_name: string;
  status: string;
  report_date: string | null;
  result_summary: string | null;
  lab_name: string | null;
}

interface ClinicalNoteRow {
  id: string;
  note_type: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  created_by: string;
  created_at: string;
}

type SupabaseResult<T> = { data: T; error: { message: string } | null };

export class SupabaseClinicalRepository implements IClinicalRepository {
  async listMedications(patientId: string): Promise<Medication[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("prescriptions")
      .select("id, prescription_items(*)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })) as unknown as SupabaseResult<
      PrescriptionRow[] | null
    >;

    if (error) throw new Error(error.message);

    const medications: Medication[] = [];
    for (const prescription of data ?? []) {
      for (const item of prescription.prescription_items ?? []) {
        medications.push({
          id: item.id,
          prescription_id: prescription.id,
          medication_name: item.medication_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          start_date: item.start_date,
          end_date: item.end_date,
          prescribing_doctor: item.prescribing_doctor,
          instructions: item.instructions,
        });
      }
    }
    return medications;
  }

  async addMedication(
    patientId: string,
    input: MedicationInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    const client = getSupabaseClient();
    const { data: prescription, error: rxError } = (await client
      .from("prescriptions")
      .insert({
        patient_id: patientId,
        organization_id: auth.selectedOrganizationId,
        clinic_id: auth.selectedClinicId ?? null,
        created_by: auth.userId,
        status: "active",
      })
      .select("id")
      .single()) as unknown as SupabaseResult<{ id: string } | null>;

    if (rxError || !prescription) {
      throw new Error(rxError?.message ?? "Could not create prescription.");
    }

    const { error } = await client.from("prescription_items").insert({
      prescription_id: prescription.id,
      medication_name: input.medication_name,
      dosage: input.dosage ?? "",
      frequency: input.frequency ?? "",
      duration: input.duration ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      prescribing_doctor: input.prescribing_doctor ?? null,
    });

    if (error) throw new Error(error.message);
  }

  async removeMedication(itemId: string): Promise<void> {
    const client = getSupabaseClient();
    const { data: item } = (await client
      .from("prescription_items")
      .select("prescription_id")
      .eq("id", itemId)
      .maybeSingle()) as unknown as SupabaseResult<{ prescription_id: string } | null>;

    const { error } = await client.from("prescription_items").delete().eq("id", itemId);
    if (error) throw new Error(error.message);

    if (item) {
      const { data: remaining } = (await client
        .from("prescription_items")
        .select("id")
        .eq("prescription_id", item.prescription_id)) as unknown as SupabaseResult<
        { id: string }[] | null
      >;
      if ((remaining ?? []).length === 0) {
        await client.from("prescriptions").delete().eq("id", item.prescription_id);
      }
    }
  }

  async listAlerts(patientId: string): Promise<MedicalAlert[]> {
    const client = getSupabaseClient();
    const [allergiesRes, historyRes] = await Promise.all([
      client
        .from("allergies")
        .select("id, allergen, reaction, severity, status")
        .eq("patient_id", patientId)
        .eq("status", "active"),
      client
        .from("medical_history")
        .select("id, condition, status")
        .eq("patient_id", patientId)
        .in("status", ["active", "chronic"]),
    ]);

    const allergies = (allergiesRes as unknown as SupabaseResult<AllergyRow[] | null>).data ?? [];
    const history = (historyRes as unknown as SupabaseResult<HistoryRow[] | null>).data ?? [];

    const alerts: MedicalAlert[] = [];
    for (const a of allergies) {
      alerts.push({
        id: a.id,
        label: a.allergen,
        severity: a.severity,
        category: "allergy",
      });
    }
    for (const h of history) {
      alerts.push({
        id: h.id,
        label: h.condition,
        severity: "chronic",
        category: "history",
      });
    }
    return alerts;
  }

  async addAllergy(
    patientId: string,
    input: AllergyInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("allergies").insert({
      patient_id: patientId,
      organization_id: auth.selectedOrganizationId,
      clinic_id: auth.selectedClinicId ?? null,
      created_by: auth.userId,
      allergen: input.allergen,
      reaction: input.reaction ?? "",
      severity: input.severity ?? "moderate",
      status: "active",
    });

    if (error) throw new Error(error.message);
  }

  async addMedicalHistory(
    patientId: string,
    input: MedicalHistoryInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("medical_history").insert({
      patient_id: patientId,
      organization_id: auth.selectedOrganizationId,
      clinic_id: auth.selectedClinicId ?? null,
      created_by: auth.userId,
      condition: input.condition,
      status: input.status ?? "active",
    });

    if (error) throw new Error(error.message);
  }

  async listAppointments(patientId: string): Promise<AppointmentSummary[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, type")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false })
      .limit(20)) as unknown as SupabaseResult<AppointmentRow[] | null>;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async listLabReports(patientId: string): Promise<LabReport[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("lab_reports")
      .select("id, test_name, status, report_date, result_summary, lab_name")
      .eq("patient_id", patientId)
      .order("report_date", { ascending: false })
      .limit(20)) as unknown as SupabaseResult<LabReportRow[] | null>;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async addLabReport(
    patientId: string,
    input: LabReportInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("lab_reports").insert({
      patient_id: patientId,
      organization_id: auth.selectedOrganizationId,
      clinic_id: auth.selectedClinicId ?? null,
      created_by: auth.userId,
      test_name: input.test_name,
      result_summary: input.result_summary ?? null,
      status: "ordered",
    });

    if (error) throw new Error(error.message);
  }

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("clinical_notes")
      .select("id, note_type, subjective, objective, assessment, plan, created_by, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(30)) as unknown as SupabaseResult<ClinicalNoteRow[] | null>;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async addClinicalNote(
    patientId: string,
    input: ClinicalNoteInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("clinical_notes").insert({
      patient_id: patientId,
      organization_id: auth.selectedOrganizationId,
      clinic_id: auth.selectedClinicId ?? null,
      created_by: auth.userId,
      note_type: input.note_type ?? "soap",
      subjective: input.subjective ?? null,
      objective: input.objective ?? null,
      assessment: input.assessment ?? null,
      plan: input.plan ?? null,
    });

    if (error) throw new Error(error.message);
  }
}
