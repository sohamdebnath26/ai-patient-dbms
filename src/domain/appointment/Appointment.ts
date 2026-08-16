import { z } from "zod";

export const AppointmentStatusEnum = z.enum([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const AppointmentTypeEnum = z.enum(["in_person", "telehealth", "home_visit"]);

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  organization_id: z.string().uuid().nullable(),
  clinic_id: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),
  appointment_date: z.string(),
  appointment_time: z.string().nullable(),
  duration_minutes: z.number(),
  type: AppointmentTypeEnum,
  status: AppointmentStatusEnum,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  patient: z
    .object({
      first_name: z.string(),
      last_name: z.string(),
      mrn: z.string(),
    })
    .optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = z.object({
  patient_id: z.string().uuid("Select a patient"),
  assigned_to: z.string().uuid().optional(),
  appointment_date: z.string().min(1, "Date is required"),
  appointment_time: z.string().optional(),
  duration_minutes: z.coerce.number().min(5).max(240),
  type: AppointmentTypeEnum,
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const AppointmentSearchSchema = z.object({
  query: z.string().optional(),
  status: AppointmentStatusEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AppointmentSearchParams = z.infer<typeof AppointmentSearchSchema>;

export interface AppointmentListPage {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
