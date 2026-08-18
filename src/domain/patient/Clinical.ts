import { z } from "zod";

export const MedicationSchema = z.object({
  id: z.string().uuid(),
  prescription_id: z.string().uuid(),
  medication_name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  prescribing_doctor: z.string().nullable(),
  instructions: z.string().nullable(),
});

export type Medication = z.infer<typeof MedicationSchema>;

export const MedicationInputSchema = z.object({
  medication_name: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  prescribing_doctor: z.string().optional(),
});

export type MedicationInput = z.infer<typeof MedicationInputSchema>;

export const ClinicalNoteSchema = z.object({
  id: z.string().uuid(),
  note_type: z.string(),
  subjective: z.string().nullable(),
  objective: z.string().nullable(),
  assessment: z.string().nullable(),
  plan: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
});

export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>;

export const ClinicalNoteInputSchema = z.object({
  note_type: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});

export type ClinicalNoteInput = z.infer<typeof ClinicalNoteInputSchema>;

export const LabReportSchema = z.object({
  id: z.string().uuid(),
  test_name: z.string(),
  status: z.string(),
  report_date: z.string().nullable(),
  result_summary: z.string().nullable(),
  lab_name: z.string().nullable(),
});

export type LabReport = z.infer<typeof LabReportSchema>;

export const MedicalAlertSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.string(),
  category: z.string(),
});

export type MedicalAlert = z.infer<typeof MedicalAlertSchema>;

export const AppointmentSummarySchema = z.object({
  id: z.string().uuid(),
  appointment_date: z.string(),
  appointment_time: z.string().nullable(),
  status: z.string(),
  type: z.string(),
});

export type AppointmentSummary = z.infer<typeof AppointmentSummarySchema>;
