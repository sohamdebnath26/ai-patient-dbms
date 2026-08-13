import { getSupabaseClient } from "@infrastructure/supabase/client";

interface PatientRow {
  first_name: string;
  last_name: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  mrn: string;
}

interface AllergyRow {
  allergen: string;
  reaction: string;
  severity: string;
}

interface DiagnosisRow {
  description: string;
  icd10_code: string | null;
  status: string;
}

interface EncounterRow {
  encounter_date: string;
  chief_complaint: string | null;
  findings: string | null;
  plan: string | null;
}

interface VitalRow {
  temperature_celsius: number | null;
  heart_rate_bpm: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  recorded_at: string;
}

interface PrescriptionRow {
  status: string;
}

interface HistoryRow {
  condition: string;
  status: string;
}

export interface PatientClinicalData {
  demographics: PatientRow | null;
  allergies: AllergyRow[];
  diagnoses: DiagnosisRow[];
  encounters: EncounterRow[];
  vitals: VitalRow[];
  prescriptions: PrescriptionRow[];
  medicalHistory: HistoryRow[];
}

export async function fetchPatientClinicalData(patientId: string): Promise<PatientClinicalData> {
  const client = getSupabaseClient();

  const [patient, allergies, diagnoses, encounters, vitals, prescriptions, history] =
    await Promise.all([
      client.from("patients").select("*").eq("id", patientId).single(),
      client.from("allergies").select("*").eq("patient_id", patientId),
      client.from("diagnoses").select("*").eq("patient_id", patientId),
      client
        .from("encounters")
        .select("*")
        .eq("patient_id", patientId)
        .order("encounter_date", { ascending: false })
        .limit(10),
      client
        .from("vitals")
        .select("*")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(10),
      client.from("prescriptions").select("*").eq("patient_id", patientId),
      client.from("medical_history").select("*").eq("patient_id", patientId),
    ]);

  return {
    demographics: (patient.data as PatientRow | null) ?? null,
    allergies: (allergies.data as AllergyRow[] | null) ?? [],
    diagnoses: (diagnoses.data as DiagnosisRow[] | null) ?? [],
    encounters: (encounters.data as EncounterRow[] | null) ?? [],
    vitals: (vitals.data as VitalRow[] | null) ?? [],
    prescriptions: (prescriptions.data as PrescriptionRow[] | null) ?? [],
    medicalHistory: (history.data as HistoryRow[] | null) ?? [],
  };
}

export function formatPatientDataForAI(data: PatientClinicalData): string {
  const lines: string[] = [];
  const d = data.demographics;

  if (d) {
    lines.push(`Patient: ${d.first_name} ${d.last_name}`);
    if (d.dob) lines.push(`Date of Birth: ${d.dob}`);
    if (d.gender) lines.push(`Gender: ${d.gender}`);
    if (d.blood_group) lines.push(`Blood Group: ${d.blood_group}`);
    lines.push(`MRN: ${d.mrn}`);
  }

  if (data.allergies.length > 0) {
    lines.push("\nAllergies:");
    for (const a of data.allergies) {
      lines.push(`- ${a.allergen}: ${a.reaction} (${a.severity})`);
    }
  }

  if (data.diagnoses.length > 0) {
    lines.push("\nDiagnoses:");
    for (const dx of data.diagnoses) {
      lines.push(`- ${dx.description}${dx.icd10_code ? ` [${dx.icd10_code}]` : ""} (${dx.status})`);
    }
  }

  if (data.encounters.length > 0) {
    lines.push("\nEncounters:");
    for (const e of data.encounters) {
      lines.push(`- ${e.encounter_date}: ${e.chief_complaint ?? "No complaint"}`);
      if (e.findings) lines.push(`  Findings: ${e.findings}`);
      if (e.plan) lines.push(`  Plan: ${e.plan}`);
    }
  }

  if (data.vitals.length > 0) {
    lines.push("\nRecent Vitals:");
    for (const v of data.vitals) {
      const parts: string[] = [];
      if (v.temperature_celsius) parts.push(`Temp ${v.temperature_celsius}°C`);
      if (v.heart_rate_bpm) parts.push(`HR ${v.heart_rate_bpm}`);
      if (v.blood_pressure_systolic)
        parts.push(`BP ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic ?? "?"}`);
      if (v.oxygen_saturation) parts.push(`SpO2 ${v.oxygen_saturation}%`);
      lines.push(`- ${v.recorded_at}: ${parts.join(", ")}`);
    }
  }

  if (data.prescriptions.length > 0) {
    lines.push("\nPrescriptions:");
    for (const p of data.prescriptions) {
      lines.push(`- Status: ${p.status}`);
    }
  }

  if (data.medicalHistory.length > 0) {
    lines.push("\nMedical History:");
    for (const h of data.medicalHistory) {
      lines.push(`- ${h.condition} (${h.status})`);
    }
  }

  return lines.join("\n");
}
