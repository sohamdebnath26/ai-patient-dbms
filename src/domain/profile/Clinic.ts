import { z } from "zod";

export const ClinicSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Clinic = z.infer<typeof ClinicSchema>;
