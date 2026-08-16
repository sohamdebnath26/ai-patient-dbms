import { z } from "zod";

export const PatientSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  clinic_id: z.string().uuid().nullable(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().nullable(),
  gender: z.string().nullable(),
  blood_group: z.string().nullable(),
  marital_status: z.string().nullable(),
  occupation: z.string().nullable(),
  email: z.string().email("Invalid email").nullable().or(z.literal("")),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  mrn: z.string().min(1, "MRN is required"),
  status: z.enum(["active", "inactive", "deceased", "archived"]),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Patient = z.infer<typeof PatientSchema>;

export const CreatePatientFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  mrn: z.string().min(1, "MRN is required"),
});

export type CreatePatientFormInput = z.infer<typeof CreatePatientFormSchema>;

export const AuthorizationContextSchema = z.object({
  userId: z.string().uuid(),
  selectedOrganizationId: z.string().uuid().nullable(),
  selectedClinicId: z.string().uuid().nullable(),
});

export type AuthorizationContext = z.infer<typeof AuthorizationContextSchema>;

export class MissingOrganizationError extends Error {
  constructor() {
    super("Your account is not assigned to an organization. Please contact your administrator.");
    this.name = "MissingOrganizationError";
  }
}

export class AccessDeniedError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class ForeignKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForeignKeyError";
  }
}

export const UpdatePatientSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  dob: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  blood_group: z.string().nullable().optional(),
  marital_status: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  mrn: z.string().min(1).optional(),
  status: z.enum(["active", "inactive", "deceased", "archived"]).optional(),
});

export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;

export const PatientSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["active", "inactive", "deceased", "archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PatientSearchParams = z.infer<typeof PatientSearchSchema>;

export interface PatientListPage {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
