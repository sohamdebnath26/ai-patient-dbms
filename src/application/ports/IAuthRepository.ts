import type { AuthSession } from "@domain/auth";
import type { AuthError } from "@domain/auth";

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends Credentials {
  confirmPassword: string;
}

export type AuthChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "PASSWORD_RECOVERY";

export interface IAuthRepository {
  signup(credentials: Credentials): Promise<{ error: AuthError | null }>;
  login(
    credentials: Credentials,
  ): Promise<{ session: AuthSession | null; error: AuthError | null }>;
  logout(): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  requestPasswordReset(email: string): Promise<{ error: AuthError | null }>;
  resetPassword(newPassword: string): Promise<{ error: AuthError | null }>;
  getSession(): Promise<{ session: AuthSession | null; error: AuthError | null }>;
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: AuthSession | null) => void,
  ): () => void;
}
