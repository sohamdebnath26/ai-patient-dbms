import { getSupabaseClient } from "@infrastructure/supabase/client";
import type { Topic, MedicalContext, ResolvedEntity } from "@domain/ai/MedicalContext";
import type { AuthorizationContext } from "@domain/patient";
import { resolveAuthScope } from "@domain/patient";

interface PatientRow {
  id: string;
  organization_id: string | null;
  mrn: string;
  first_name: string;
  last_name: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  marital_status: string | null;
  occupation: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  chronic_conditions: string | null;
  primary_diagnosis: string | null;
  secondary_diagnosis: string | null;
  skin_type: string | null;
  affected_body_areas: string | null;
  disease_severity: string | null;
  duration: string | null;
  current_flare: boolean | null;
  family_history: string | null;
  previous_skin_cancer: boolean | null;
  current_treatment: string | null;
  medical_notes: string | null;
  chief_complaint: string | null;
  present_illness: string | null;
  previous_skin_diseases: string | null;
  previous_surgeries: string | null;
  other_medical_conditions: string | null;
  family_history_skin: string | null;
  family_history_cancer: string | null;
  smoking_status: string | null;
  alcohol_consumption: string | null;
  pregnancy_status: string | null;
  date_of_onset: string | null;
  symptoms: string | null;
  sun_exposure_history: string | null;
  cosmetic_product_usage: string | null;
  occupational_exposure: string | null;
}

interface AllergyRow {
  id: string;
  allergen: string;
  reaction: string;
  severity: string;
  status: string;
  recorded_date: string;
  notes: string | null;
}

interface DiagnosisRow {
  id: string;
  icd10_code: string | null;
  description: string;
  diagnosis_type: string;
  status: string;
  onset_date: string | null;
  notes: string | null;
}

interface EncounterRow {
  id: string;
  appointment_id: string | null;
  encounter_date: string;
  chief_complaint: string | null;
  findings: string | null;
  plan: string | null;
  status: string;
}

interface ConsultationRow {
  id: string;
  appointment_id: string | null;
  consultation_date: string;
  chief_complaint: string | null;
  findings: string | null;
  plan: string | null;
  status: string;
}

interface VitalRow {
  id: string;
  consultation_id: string | null;
  temperature_celsius: number | null;
  heart_rate_bpm: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  recorded_at: string;
}

interface PrescriptionRow {
  id: string;
  consultation_id: string | null;
  status: string;
  notes: string | null;
}

interface PrescriptionItemRow {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  quantity: number | null;
  refills: number | null;
}

interface HistoryRow {
  id: string;
  condition: string;
  diagnosis_date: string | null;
  status: string;
  notes: string | null;
}

interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string | null;
  duration_minutes: number;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
}

interface ClinicalNoteRow {
  id: string;
  note_type: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  created_at: string;
}

interface LabReportRow {
  id: string;
  test_name: string;
  status: string;
  report_date: string | null;
  result_summary: string | null;
  lab_name: string | null;
}

export interface ResolvedPatientHandle {
  patient: PatientRow | null;
  matched: "id" | "mrn" | "name" | "selected" | "none";
}

function safeCastArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "data" in raw && raw.data !== null) {
    const record = raw as Record<string, unknown>;
    const data = record["data"];
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

interface QueryResult {
  table: string;
  rows: readonly unknown[];
}

export class PatientContextResolver {
  async resolvePatient(
    entity: ResolvedEntity,
    auth: AuthorizationContext,
  ): Promise<ResolvedPatientHandle> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);

    const baseSelect =
      "id, organization_id, mrn, first_name, last_name, dob, gender, blood_group, marital_status, occupation, email, phone, address, status, address_line1, address_line2, city, state, country, postal_code, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, chronic_conditions, primary_diagnosis, secondary_diagnosis, skin_type, affected_body_areas, disease_severity, duration, current_flare, family_history, previous_skin_cancer, current_treatment, medical_notes, chief_complaint, present_illness, previous_skin_diseases, previous_surgeries, other_medical_conditions, family_history_skin, family_history_cancer, smoking_status, alcohol_consumption, pregnancy_status, date_of_onset, symptoms, sun_exposure_history, cosmetic_product_usage, occupational_exposure";

    if (entity.patient_id) {
      const { data, error } = (await client
        .from("patients")
        .select(baseSelect)
        .eq("id", entity.patient_id)
        .eq(scope.column, scope.value)
        .maybeSingle()) as unknown as {
        data: PatientRow | null;
        error: { message?: string } | null;
      };
      if (error) return { patient: null, matched: "none" };
      if (data) return { patient: data, matched: "id" };
    }

    if (entity.patient_mrn) {
      const { data, error } = (await client
        .from("patients")
        .select(baseSelect)
        .eq("mrn", entity.patient_mrn.toUpperCase())
        .eq(scope.column, scope.value)
        .maybeSingle()) as unknown as {
        data: PatientRow | null;
        error: { message?: string } | null;
      };
      if (error) return { patient: null, matched: "none" };
      if (data) return { patient: data, matched: "mrn" };
    }

    if (entity.patient_last_name) {
      const first = entity.patient_first_name ?? "";
      const query = client
        .from("patients")
        .select(baseSelect)
        .eq(scope.column, scope.value)
        .ilike("last_name", entity.patient_last_name);
      if (first) {
        const result = (await query.ilike("first_name", first).limit(2)) as unknown as {
          data: PatientRow[] | null;
        };
        if (result.data && result.data.length > 0) {
          return { patient: result.data[0] ?? null, matched: "name" };
        }
      } else {
        const result = (await query.limit(2)) as unknown as { data: PatientRow[] | null };
        if (result.data && result.data.length > 0) {
          return { patient: result.data[0] ?? null, matched: "name" };
        }
      }
    }

    return { patient: null, matched: "none" };
  }

  async fetchContext(
    entity: ResolvedEntity,
    patient: PatientRow | null,
    auth: AuthorizationContext,
  ): Promise<MedicalContext> {
    const client = getSupabaseClient();
    const topics = new Set<Topic>(entity.topics);
    const scope = resolveAuthScope(auth);

    if (!patient) {
      return {
        patient: null,
        allergies: [],
        diagnoses: [],
        encounters: [],
        consultations: [],
        vitals: [],
        prescriptions: [],
        prescription_items: [],
        medical_history: [],
        clinical_notes: [],
        lab_reports: [],
        appointments: [],
        image_analyses: [],
        topics: Array.from(topics),
        resolved_entity: entity,
      };
    }

    const pid = patient.id;
    const shouldFetch = (topic: Topic) => topics.size === 0 || topics.has(topic);

    const queries: Array<Promise<QueryResult> | PromiseLike<QueryResult>> = [];

    if (shouldFetch("allergy")) {
      queries.push(
        client
          .from("allergies")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("recorded_date", { ascending: false })
          .limit(20)
          .then((r: unknown): QueryResult => ({
            table: "allergies",
            rows: safeCastArray<AllergyRow>(r),
          })),
      );
    }

    if (shouldFetch("diagnosis")) {
      queries.push(
        client
          .from("diagnoses")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("onset_date", { ascending: false })
          .limit(20)
          .then((r: unknown): QueryResult => ({
            table: "diagnoses",
            rows: safeCastArray<DiagnosisRow>(r),
          })),
      );
    }

    if (shouldFetch("encounter")) {
      queries.push(
        client
          .from("encounters")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("encounter_date", { ascending: false })
          .limit(10)
          .then((r: unknown): QueryResult => ({
            table: "encounters",
            rows: safeCastArray<EncounterRow>(r),
          })),
      );
    }

    if (shouldFetch("consultation") || shouldFetch("encounter")) {
      queries.push(
        client
          .from("consultations")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("consultation_date", { ascending: false })
          .limit(10)
          .then((r: unknown): QueryResult => ({
            table: "consultations",
            rows: safeCastArray<ConsultationRow>(r),
          })),
      );
    }

    if (shouldFetch("vitals")) {
      queries.push(
        client
          .from("vitals")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("recorded_at", { ascending: false })
          .limit(10)
          .then((r: unknown): QueryResult => ({
            table: "vitals",
            rows: safeCastArray<VitalRow>(r),
          })),
      );
    }

    if (shouldFetch("prescription")) {
      queries.push(
        client
          .from("prescriptions")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("created_at", { ascending: false })
          .limit(10)
          .then((r: unknown): QueryResult => ({
            table: "prescriptions",
            rows: safeCastArray<PrescriptionRow>(r),
          })),
      );
    }

    if (shouldFetch("history")) {
      queries.push(
        client
          .from("medical_history")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("diagnosis_date", { ascending: false })
          .limit(20)
          .then((r: unknown): QueryResult => ({
            table: "medical_history",
            rows: safeCastArray<HistoryRow>(r),
          })),
      );
    }

    if (shouldFetch("appointment")) {
      queries.push(
        client
          .from("appointments")
          .select("*")
          .eq("patient_id", pid)
          .eq(scope.column, scope.value)
          .order("appointment_date", { ascending: false })
          .limit(10)
          .then((r: unknown): QueryResult => ({
            table: "appointments",
            rows: safeCastArray<AppointmentRow>(r),
          })),
      );
    }

    queries.push(
      client
        .from("clinical_notes")
        .select("id, note_type, subjective, objective, assessment, plan, created_at")
        .eq("patient_id", pid)
        .eq(scope.column, scope.value)
        .order("created_at", { ascending: false })
        .limit(20)
        .then((r: unknown): QueryResult => ({
          table: "clinical_notes",
          rows: safeCastArray<ClinicalNoteRow>(r),
        })),
    );

    queries.push(
      client
        .from("lab_reports")
        .select("id, test_name, status, report_date, result_summary, lab_name")
        .eq("patient_id", pid)
        .eq(scope.column, scope.value)
        .order("report_date", { ascending: false })
        .limit(20)
        .then((r: unknown): QueryResult => ({
          table: "lab_reports",
          rows: safeCastArray<LabReportRow>(r),
        })),
    );

    const results = await Promise.all(queries);

    const allergies: AllergyRow[] = [];
    const diagnoses: DiagnosisRow[] = [];
    const encounters: EncounterRow[] = [];
    const consultations: ConsultationRow[] = [];
    const vitals: VitalRow[] = [];
    const prescriptions: PrescriptionRow[] = [];
    const medicalHistory: HistoryRow[] = [];
    const appointments: AppointmentRow[] = [];
    const clinicalNotes: ClinicalNoteRow[] = [];
    const labReports: LabReportRow[] = [];

    for (const r of results) {
      switch (r.table) {
        case "allergies":
          allergies.push(...(r.rows as AllergyRow[]));
          break;
        case "diagnoses":
          diagnoses.push(...(r.rows as DiagnosisRow[]));
          break;
        case "encounters":
          encounters.push(...(r.rows as EncounterRow[]));
          break;
        case "consultations":
          consultations.push(...(r.rows as ConsultationRow[]));
          break;
        case "vitals":
          vitals.push(...(r.rows as VitalRow[]));
          break;
        case "prescriptions":
          prescriptions.push(...(r.rows as PrescriptionRow[]));
          break;
        case "medical_history":
          medicalHistory.push(...(r.rows as HistoryRow[]));
          break;
        case "appointments":
          appointments.push(...(r.rows as AppointmentRow[]));
          break;
        case "clinical_notes":
          clinicalNotes.push(...(r.rows as ClinicalNoteRow[]));
          break;
        case "lab_reports":
          labReports.push(...(r.rows as LabReportRow[]));
          break;
      }
    }

    let prescriptionItems: PrescriptionItemRow[] = [];
    if (prescriptions.length > 0) {
      const rxIds = prescriptions.map((p) => p.id);
      const { data } = (await client
        .from("prescription_items")
        .select("*")
        .in("prescription_id", rxIds)
        .limit(50)) as unknown as { data: PrescriptionItemRow[] | null };
      prescriptionItems = data ?? [];
    }

    return {
      patient,
      allergies: allergies as unknown as MedicalContext["allergies"],
      diagnoses: diagnoses as unknown as MedicalContext["diagnoses"],
      encounters: encounters as unknown as MedicalContext["encounters"],
      consultations: consultations as unknown as MedicalContext["consultations"],
      vitals: vitals as unknown as MedicalContext["vitals"],
      prescriptions: prescriptions as unknown as MedicalContext["prescriptions"],
      prescription_items: prescriptionItems as unknown as MedicalContext["prescription_items"],
      medical_history: medicalHistory as unknown as MedicalContext["medical_history"],
      clinical_notes: clinicalNotes as unknown as MedicalContext["clinical_notes"],
      lab_reports: labReports as unknown as MedicalContext["lab_reports"],
      appointments: appointments as unknown as MedicalContext["appointments"],
      image_analyses: [] as unknown as MedicalContext["image_analyses"],
      topics: Array.from(topics),
      resolved_entity: entity,
    };
  }
}
