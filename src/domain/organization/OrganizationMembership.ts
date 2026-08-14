import { z } from "zod";

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const MembershipRoleSchema = z.enum(["admin", "doctor", "receptionist", "pharmacist"]);
export type MembershipRole = z.infer<typeof MembershipRoleSchema>;

export const MembershipStatusSchema = z.enum(["active", "invited", "suspended"]);
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

export const OrganizationMembershipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  clinicId: z.string().uuid().nullable(),
  role: MembershipRoleSchema,
  status: MembershipStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  organization: OrganizationSchema.optional(),
});

export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;

export type ActiveOrganizationMembership = Omit<OrganizationMembership, "status"> & {
  status: "active";
};
