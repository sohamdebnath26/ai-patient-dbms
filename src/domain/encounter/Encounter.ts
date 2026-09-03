import { z } from "zod";

export const EncounterStatusEnum = z.enum(["in_progress", "completed", "cancelled"]);

export const EncounterSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid().nullable(),
  clinic_id: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),
  encounter_date: z.string(),
  encounter_number: z.string().nullable(),
  chief_complaint: z.string().nullable(),
  present_illness: z.string().nullable(),
  duration_: z.string().nullable(),
  symptoms: z.string().nullable(),
  associated_symptoms: z.string().nullable(),
  general_examination: z.string().nullable(),
  local_skin_examination: z.string().nullable(),
  body_site: z.string().nullable(),
  lesion_description: z.string().nullable(),
  morphology: z.string().nullable(),
  distribution: z.string().nullable(),
  color: z.string().nullable(),
  borders: z.string().nullable(),
  texture: z.string().nullable(),
  scaling: z.string().nullable(),
  pigmentation: z.string().nullable(),
  tenderness: z.string().nullable(),
  temperature: z.string().nullable(),
  findings: z.string().nullable(),
  plan: z.string().nullable(),
  follow_up_date: z.string().nullable(),
  follow_up_advice: z.string().nullable(),
  follow_up_warnings: z.string().nullable(),
  follow_up_lifestyle_advice: z.string().nullable(),
  status: EncounterStatusEnum,
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  patient: z
    .object({
      first_name: z.string(),
      last_name: z.string(),
    })
    .optional(),
});

export type Encounter = z.infer<typeof EncounterSchema>;

export const UpdateEncounterSchema = z.object({
  encounter_number: z.string().nullable().optional(),
  chief_complaint: z.string().nullable().optional(),
  present_illness: z.string().nullable().optional(),
  duration_: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  associated_symptoms: z.string().nullable().optional(),
  general_examination: z.string().nullable().optional(),
  local_skin_examination: z.string().nullable().optional(),
  body_site: z.string().nullable().optional(),
  lesion_description: z.string().nullable().optional(),
  morphology: z.string().nullable().optional(),
  distribution: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  borders: z.string().nullable().optional(),
  texture: z.string().nullable().optional(),
  scaling: z.string().nullable().optional(),
  pigmentation: z.string().nullable().optional(),
  tenderness: z.string().nullable().optional(),
  temperature: z.string().nullable().optional(),
  findings: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  follow_up_advice: z.string().nullable().optional(),
  follow_up_warnings: z.string().nullable().optional(),
  follow_up_lifestyle_advice: z.string().nullable().optional(),
  status: EncounterStatusEnum.optional(),
});

export type UpdateEncounterInput = z.infer<typeof UpdateEncounterSchema>;
