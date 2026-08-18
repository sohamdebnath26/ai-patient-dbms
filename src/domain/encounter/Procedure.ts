import { z } from "zod";

export const ProcedureTypeEnum = z.enum([
  "cryotherapy",
  "biopsy",
  "excision",
  "laser",
  "chemical_peel",
  "electrocautery",
  "other",
]);

export type ProcedureType = z.infer<typeof ProcedureTypeEnum>;

export const ProcedureSchema = z.object({
  id: z.string().uuid(),
  encounter_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  procedure_type: ProcedureTypeEnum,
  body_site: z.string().nullable(),
  notes: z.string().nullable(),
  performed_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Procedure = z.infer<typeof ProcedureSchema>;

export const ProcedureInputSchema = z.object({
  procedure_type: ProcedureTypeEnum,
  body_site: z.string().optional(),
  notes: z.string().optional(),
  performed_date: z.string().optional(),
});

export type ProcedureInput = z.infer<typeof ProcedureInputSchema>;
