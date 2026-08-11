import { z } from "zod";

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
