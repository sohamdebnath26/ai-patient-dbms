import type { AuthSession } from "@domain/auth";
import type { AuthError } from "@domain/auth";

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends Credentials {
  confirmPassword: string;
}

export interface IAuthRepository {
  signup(credentials: Credentials): Promise<{ error: AuthError | null }>;
  login(
    credentials: Credentials,
  ): Promise<{ session: AuthSession | null; error: AuthError | null }>;
  logout(): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  requestPasswordReset(email: string): Promise<{ error: AuthError | null }>;
  resetPassword(accessToken: string, newPassword: string): Promise<{ error: AuthError | null }>;
  getSession(): Promise<{ session: AuthSession | null; error: AuthError | null }>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
}
