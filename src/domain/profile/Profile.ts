import { z } from "zod";

export const RoleSchema = z.enum(["admin", "doctor", "receptionist", "patient", "pharmacist"]);
export type Role = z.infer<typeof RoleSchema>;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  doctor: "Doctor",
  receptionist: "Receptionist",
  patient: "Patient",
  pharmacist: "Pharmacist",
};

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: RoleSchema,
  organizationId: z.string().uuid().nullable(),
  clinicId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const CreateProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema.default("patient"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
