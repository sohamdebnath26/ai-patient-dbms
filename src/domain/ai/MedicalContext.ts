import { z } from "zod";

export const TopicSchema = z.enum([
  "patient",
  "appointment",
  "encounter",
  "diagnosis",
  "prescription",
  "allergy",
  "vitals",
  "history",
  "consultation",
]);

export type Topic = z.infer<typeof TopicSchema>;

export const ResolvedEntitySchema = z.object({
  patient_first_name: z.string().nullable(),
  patient_last_name: z.string().nullable(),
  patient_mrn: z.string().nullable(),
  patient_id: z.string().uuid().nullable(),
  topics: z.array(TopicSchema),
});

export type ResolvedEntity = z.infer<typeof ResolvedEntitySchema>;

export const MedicalContextSchema = z.object({
  patient: z
    .object({
      id: z.string().uuid(),
      organization_id: z.string().uuid().nullable(),
      mrn: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      dob: z.string().nullable(),
      gender: z.string().nullable(),
      blood_group: z.string().nullable(),
      marital_status: z.string().nullable(),
      occupation: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      status: z.string(),
      address_line1: z.string().nullable(),
      address_line2: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      country: z.string().nullable(),
      postal_code: z.string().nullable(),
      emergency_contact_name: z.string().nullable(),
      emergency_contact_phone: z.string().nullable(),
      emergency_contact_relationship: z.string().nullable(),
      chronic_conditions: z.string().nullable(),
      primary_diagnosis: z.string().nullable(),
      secondary_diagnosis: z.string().nullable(),
      skin_type: z.string().nullable(),
      affected_body_areas: z.string().nullable(),
      disease_severity: z.string().nullable(),
      duration: z.string().nullable(),
      current_flare: z.boolean().nullable(),
      family_history: z.string().nullable(),
      previous_skin_cancer: z.boolean().nullable(),
      current_treatment: z.string().nullable(),
      medical_notes: z.string().nullable(),
    })
    .nullable(),
  allergies: z.array(z.record(z.unknown())),
  diagnoses: z.array(z.record(z.unknown())),
  encounters: z.array(z.record(z.unknown())),
  consultations: z.array(z.record(z.unknown())),
  vitals: z.array(z.record(z.unknown())),
  prescriptions: z.array(z.record(z.unknown())),
  prescription_items: z.array(z.record(z.unknown())),
  medical_history: z.array(z.record(z.unknown())),
  appointments: z.array(z.record(z.unknown())),
  topics: z.array(TopicSchema),
  resolved_entity: ResolvedEntitySchema,
});

export type MedicalContext = z.infer<typeof MedicalContextSchema>;

export const EMPTY_CONTEXT: MedicalContext = {
  patient: null,
  allergies: [],
  diagnoses: [],
  encounters: [],
  consultations: [],
  vitals: [],
  prescriptions: [],
  prescription_items: [],
  medical_history: [],
  appointments: [],
  topics: [],
  resolved_entity: {
    patient_first_name: null,
    patient_last_name: null,
    patient_mrn: null,
    patient_id: null,
    topics: [],
  },
};
