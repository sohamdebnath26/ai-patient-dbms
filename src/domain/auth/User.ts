import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  lastSignInAt: z.string().nullable(),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthSessionSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;
