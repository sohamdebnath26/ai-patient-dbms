import type { IAuthRepository, Credentials } from "@application/ports/IAuthRepository";
import type { AuthSession, AuthError } from "@domain/auth";

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async signup(credentials: Credentials): Promise<{ success: boolean; error: AuthError | null }> {
    const { error } = await this.authRepository.signup(credentials);
    if (error) return { success: false, error };
    return { success: true, error: null };
  }

  async login(
    credentials: Credentials,
  ): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    return this.authRepository.login(credentials);
  }

  async logout(): Promise<void> {
    await this.authRepository.logout();
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.authRepository.deleteAccount(userId);
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; error: AuthError | null }> {
    const { error } = await this.authRepository.requestPasswordReset(email);
    if (error) return { success: false, error };
    return { success: true, error: null };
  }

  async resetPassword(
    accessToken: string,
    newPassword: string,
  ): Promise<{ success: boolean; error: AuthError | null }> {
    const { error } = await this.authRepository.resetPassword(accessToken, newPassword);
    if (error) return { success: false, error };
    return { success: true, error: null };
  }

  async getSession(): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    return this.authRepository.getSession();
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    return this.authRepository.onAuthStateChange(callback);
  }
}
