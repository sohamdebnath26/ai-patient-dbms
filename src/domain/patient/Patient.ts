import { z } from "zod";

export const PatientStatusSchema = z.enum([
  "active",
  "inactive",
  "deceased",
  "archived",
  "deregistered",
]);

export type PatientStatus = z.infer<typeof PatientStatusSchema>;

export const PatientSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid().nullable(),
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
  status: PatientStatusSchema,
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
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
});

export type Patient = z.infer<typeof PatientSchema>;

export const CreatePatientFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  blood_group: z.string().optional(),
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

/**
 * True when the current auth context is org-scoped (i.e. the user has
 * selected an organization). Repositories branch on this to either
 * filter by organization_id OR by created_by = auth.uid().
 */
export function isOrgScoped(auth: AuthorizationContext): boolean {
  return auth.selectedOrganizationId !== null;
}

/**
 * Returns the WHERE-clause pair a repository should use to scope a read
 * to data the current user is allowed to see.
 * - With an org: rows WHERE organization_id = the org.
 * - Without an org: rows WHERE created_by = the user.
 */
export function resolveAuthScope(auth: AuthorizationContext): {
  column: "organization_id" | "created_by";
  value: string;
} {
  if (auth.selectedOrganizationId) {
    return { column: "organization_id", value: auth.selectedOrganizationId };
  }
  return { column: "created_by", value: auth.userId };
}

export const UpdatePatientSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  dob: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  blood_group: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  mrn: z.string().min(1).optional(),
  status: PatientStatusSchema.optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  emergency_contact_relationship: z.string().nullable().optional(),
  chronic_conditions: z.string().nullable().optional(),
  primary_diagnosis: z.string().nullable().optional(),
  secondary_diagnosis: z.string().nullable().optional(),
  skin_type: z.string().nullable().optional(),
  affected_body_areas: z.string().nullable().optional(),
  disease_severity: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  current_flare: z.boolean().nullable().optional(),
  family_history: z.string().nullable().optional(),
  previous_skin_cancer: z.boolean().nullable().optional(),
  current_treatment: z.string().nullable().optional(),
  medical_notes: z.string().nullable().optional(),
});

export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;

const todayStr = new Date().toISOString().slice(0, 10);

export const EditPatientFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => v <= todayStr, "Date of birth cannot be in the future"),
  gender: z.string().min(1, "Gender is required"),
  blood_group: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number"),
  mrn: z.string().min(1, "MRN is required"),
  status: PatientStatusSchema,
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  chronic_conditions: z.string().optional(),
  primary_diagnosis: z.string().optional(),
  secondary_diagnosis: z.string().optional(),
  skin_type: z.string().optional(),
  affected_body_areas: z.string().optional(),
  disease_severity: z.string().optional(),
  duration: z.string().optional(),
  current_flare: z.boolean().optional(),
  family_history: z.string().optional(),
  previous_skin_cancer: z.boolean().optional(),
  current_treatment: z.string().optional(),
  medical_notes: z.string().optional(),
});

export type EditPatientFormInput = z.infer<typeof EditPatientFormSchema>;

export const PatientSearchSchema = z.object({
  query: z.string().optional(),
  status: PatientStatusSchema.optional(),
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
