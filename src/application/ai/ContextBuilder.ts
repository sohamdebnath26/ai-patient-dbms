import type { MedicalContext, Topic } from "@domain/ai/MedicalContext";

type Row = Record<string, unknown>;

function safeString(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export interface BuiltContext {
  prompt: string;
  patientFound: boolean;
  topicsCovered: Topic[];
}

export class ContextBuilder {
  build(context: MedicalContext): BuiltContext {
    const { patient, resolved_entity, topics } = context;

    if (!patient) {
      const name =
        `${resolved_entity.patient_first_name ?? ""} ${resolved_entity.patient_last_name ?? ""}`.trim();
      const mrn = resolved_entity.patient_mrn ?? "";
      const identifier = name || mrn || "the patient";
      return {
        patientFound: false,
        topicsCovered: topics,
        prompt:
          `PATIENT NOT FOUND: The user asked about ${identifier}, but no patient matches this identifier in the database.\n\n` +
          `Tell the user clearly that this patient does not exist and ask them to check the name or MRN. Do not fabricate any patient data.`,
      };
    }

    const sections: string[] = [];
    const fetchedTopics: Topic[] = [];

    sections.push(`PATIENT: ${patient.first_name} ${patient.last_name} (MRN: ${patient.mrn})`);
    if (patient.dob) sections.push(`Date of Birth: ${patient.dob}`);
    if (patient.gender) sections.push(`Gender: ${patient.gender}`);
    if (patient.blood_group) sections.push(`Blood Group: ${patient.blood_group}`);
    if (patient.marital_status) sections.push(`Marital Status: ${patient.marital_status}`);
    if (patient.occupation) sections.push(`Occupation: ${patient.occupation}`);
    if (patient.address) sections.push(`Address: ${patient.address}`);
    if (patient.phone) sections.push(`Phone: ${patient.phone}`);
    if (patient.email) sections.push(`Email: ${patient.email}`);
    sections.push(`Status: ${patient.status}`);

    if (patient.primary_diagnosis) sections.push(`Primary Diagnosis: ${patient.primary_diagnosis}`);
    if (patient.secondary_diagnosis)
      sections.push(`Secondary Diagnosis: ${patient.secondary_diagnosis}`);
    if (patient.skin_type) sections.push(`Skin Type (Fitzpatrick): ${patient.skin_type}`);
    if (patient.affected_body_areas)
      sections.push(`Affected Body Areas: ${patient.affected_body_areas}`);
    if (patient.disease_severity) sections.push(`Disease Severity: ${patient.disease_severity}`);
    if (patient.duration) sections.push(`Duration: ${patient.duration}`);
    if (patient.current_flare !== null)
      sections.push(`Current Flare: ${patient.current_flare ? "Yes" : "No"}`);
    if (patient.family_history) sections.push(`Family History: ${patient.family_history}`);
    if (patient.previous_skin_cancer !== null)
      sections.push(`Previous Skin Cancer: ${patient.previous_skin_cancer ? "Yes" : "No"}`);
    if (patient.current_treatment) sections.push(`Current Treatment: ${patient.current_treatment}`);
    if (patient.chronic_conditions)
      sections.push(`Chronic Conditions: ${patient.chronic_conditions}`);
    if (patient.medical_notes) sections.push(`Medical Notes: ${patient.medical_notes}`);

    if (context.allergies.length > 0) {
      fetchedTopics.push("allergy");
      sections.push("\nALLERGIES:");
      for (const item of context.allergies) {
        const row = item as Row;
        sections.push(
          `- ${safeString(row["allergen"])}: ${safeString(row["reaction"])} (Severity: ${safeString(row["severity"])}, Status: ${safeString(row["status"])}, Recorded: ${safeString(row["recorded_date"])})`,
        );
      }
    }

    if (context.diagnoses.length > 0) {
      fetchedTopics.push("diagnosis");
      sections.push("\nDIAGNOSES:");
      for (const item of context.diagnoses) {
        const row = item as Row;
        const icd = row["icd10_code"] ? ` [${safeString(row["icd10_code"])}]` : "";
        sections.push(
          `- ${safeString(row["description"])}${icd} (${safeString(row["diagnosis_type"])}, ${safeString(row["status"])}, Onset: ${safeString(row["onset_date"])})`,
        );
      }
    }

    if (context.encounters.length > 0) {
      fetchedTopics.push("encounter");
      sections.push("\nENCOUNTERS:");
      for (const item of context.encounters) {
        const row = item as Row;
        sections.push(
          `- ${safeString(row["encounter_date"])}: ${safeString(row["chief_complaint"], "No complaint recorded")}`,
        );
        if (row["findings"]) sections.push(`  Findings: ${safeString(row["findings"])}`);
        if (row["plan"]) sections.push(`  Plan: ${safeString(row["plan"])}`);
      }
    }

    if (context.consultations.length > 0) {
      fetchedTopics.push("consultation");
      sections.push("\nCONSULTATIONS:");
      for (const item of context.consultations) {
        const row = item as Row;
        sections.push(
          `- ${safeString(row["consultation_date"])}: ${safeString(row["chief_complaint"], "No complaint recorded")}`,
        );
        if (row["findings"]) sections.push(`  Findings: ${safeString(row["findings"])}`);
        if (row["plan"]) sections.push(`  Plan: ${safeString(row["plan"])}`);
      }
    }

    if (context.vitals.length > 0) {
      fetchedTopics.push("vitals");
      sections.push("\nVITALS (most recent first):");
      for (const item of context.vitals) {
        const row = item as Row;
        const parts: string[] = [];
        if (row["temperature_celsius"] !== null && row["temperature_celsius"] !== undefined)
          parts.push(`Temp ${safeString(row["temperature_celsius"])}°C`);
        if (row["heart_rate_bpm"] !== null && row["heart_rate_bpm"] !== undefined)
          parts.push(`HR ${safeString(row["heart_rate_bpm"])} bpm`);
        if (row["blood_pressure_systolic"] !== null && row["blood_pressure_systolic"] !== undefined)
          parts.push(
            `BP ${safeString(row["blood_pressure_systolic"])}/${safeString(row["blood_pressure_diastolic"], "?")} mmHg`,
          );
        if (row["respiratory_rate"] !== null && row["respiratory_rate"] !== undefined)
          parts.push(`RR ${safeString(row["respiratory_rate"])}/min`);
        if (row["oxygen_saturation"] !== null && row["oxygen_saturation"] !== undefined)
          parts.push(`SpO2 ${safeString(row["oxygen_saturation"])}%`);
        if (row["height_cm"] !== null || row["weight_kg"] !== null) {
          parts.push(
            `H ${safeString(row["height_cm"], "?")}cm / W ${safeString(row["weight_kg"], "?")}kg`,
          );
        }
        sections.push(
          `- ${safeString(row["recorded_at"])}: ${parts.join(", ") || "No measurements recorded"}`,
        );
      }
    }

    if (context.prescriptions.length > 0) {
      fetchedTopics.push("prescription");
      sections.push("\nPRESCRIPTIONS:");
      for (const item of context.prescriptions) {
        const row = item as Row;
        sections.push(
          `- Prescription ${safeString(row["id"])} (Status: ${safeString(row["status"])})`,
        );
        if (row["notes"]) sections.push(`  Notes: ${safeString(row["notes"])}`);
      }

      if (context.prescription_items.length > 0) {
        const itemsByRx = new Map<string, Row[]>();
        for (const item of context.prescription_items) {
          const row = item as Row;
          const rxId = safeString(row["prescription_id"]);
          const list = itemsByRx.get(rxId) ?? [];
          list.push(row);
          itemsByRx.set(rxId, list);
        }
        for (const [, items] of itemsByRx) {
          for (const item of items) {
            sections.push(
              `  • ${safeString(item["medication_name"])} — ${safeString(item["dosage"])}, ${safeString(item["frequency"])} (${safeString(item["duration"], "—")})`,
            );
          }
        }
      }
    }

    if (context.medical_history.length > 0) {
      fetchedTopics.push("history");
      sections.push("\nMEDICAL HISTORY:");
      for (const item of context.medical_history) {
        const row = item as Row;
        sections.push(
          `- ${safeString(row["condition"])} (${safeString(row["status"])}, Diagnosed: ${safeString(row["diagnosis_date"])})`,
        );
      }
    }

    if (context.appointments.length > 0) {
      fetchedTopics.push("appointment");
      sections.push("\nAPPOINTMENTS (most recent first):");
      for (const item of context.appointments) {
        const row = item as Row;
        sections.push(
          `- ${safeString(row["appointment_date"])} ${safeString(row["appointment_time"])} (${safeString(row["type"])}, ${safeString(row["status"])}, ${safeString(row["duration_minutes"])} min)`,
        );
        if (row["reason"]) sections.push(`  Reason: ${safeString(row["reason"])}`);
        if (row["notes"]) sections.push(`  Notes: ${safeString(row["notes"])}`);
      }
    }

    const instruction =
      `Use ONLY the patient data provided below to answer the user's question. Do not fabricate any information. ` +
      `If the user's question cannot be answered from the data provided, say so clearly and suggest what data would be needed. ` +
      `You may provide analysis and clinical context based on the structured data, but every clinical claim must be supported by the data below.`;

    const prompt = `${instruction}\n\nRETRIEVED CONTEXT:\n${sections.join("\n")}`;

    return {
      patientFound: true,
      topicsCovered: Array.from(new Set([...topics, ...fetchedTopics])),
      prompt,
    };
  }
}
