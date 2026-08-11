import { z } from "zod";

export const EncounterStatusEnum = z.enum(["in_progress", "completed", "cancelled"]);

export const EncounterSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid(),
  clinic_id: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),
  encounter_date: z.string(),
  chief_complaint: z.string().nullable(),
  findings: z.string().nullable(),
  plan: z.string().nullable(),
  status: EncounterStatusEnum,
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Encounter = z.infer<typeof EncounterSchema>;

export const UpdateEncounterSchema = z.object({
  chief_complaint: z.string().optional(),
  findings: z.string().optional(),
  plan: z.string().optional(),
  status: EncounterStatusEnum.optional(),
});

export type UpdateEncounterInput = z.infer<typeof UpdateEncounterSchema>;
