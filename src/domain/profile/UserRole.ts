import { z } from "zod";
import { RoleSchema } from "./Profile";

export const UserRoleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: RoleSchema,
  assignedAt: z.string(),
  assignedBy: z.string().uuid().nullable(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
