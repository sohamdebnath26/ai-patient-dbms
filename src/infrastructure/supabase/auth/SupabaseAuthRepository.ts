import type { IAuthRepository, Credentials } from "@application/ports/IAuthRepository";
import type { AuthSession, AuthError } from "@domain/auth";
import { mapSupabaseError } from "@domain/auth";
import { getSupabaseClient } from "../client";

function toAuthSession(
  supabaseSession: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    user: {
      id: string;
      email?: string;
      email_confirmed_at?: string;
      last_sign_in_at?: string;
      created_at: string;
    };
  } | null,
): AuthSession | null {
  if (!supabaseSession) return null;

  return {
    user: {
      id: supabaseSession.user.id,
      email: supabaseSession.user.email ?? "",
      emailVerified: !!supabaseSession.user.email_confirmed_at,
      lastSignInAt: supabaseSession.user.last_sign_in_at ?? null,
      createdAt: supabaseSession.user.created_at,
    },
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: supabaseSession.expires_at ?? 0,
  };
}

export class SupabaseAuthRepository implements IAuthRepository {
  async signup(credentials: Credentials): Promise<{ error: AuthError | null }> {
    const client = getSupabaseClient();
    const { error } = await client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) return { error: mapSupabaseError(error) };
    return { error: null };
  }

  async login(
    credentials: Credentials,
  ): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) return { session: null, error: mapSupabaseError(error) };
    return { session: toAuthSession(data.session), error: null };
  }

  async logout(): Promise<void> {
    const client = getSupabaseClient();
    await client.auth.signOut();
  }

  async requestPasswordReset(email: string): Promise<{ error: AuthError | null }> {
    const client = getSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { error: mapSupabaseError(error) };
    return { error: null };
  }

  async resetPassword(
    accessToken: string,
    newPassword: string,
  ): Promise<{ error: AuthError | null }> {
    const client = getSupabaseClient();
    const { data, error: sessionError } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });
    if (sessionError) return { error: mapSupabaseError(sessionError) };
    if (!data.session)
      return { error: { code: "session-expired", message: "Invalid or expired reset link." } };

    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) return { error: mapSupabaseError(error) };
    return { error: null };
  }

  async getSession(): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error) return { session: null, error: mapSupabaseError(error) };
    return { session: toAuthSession(data.session), error: null };
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const client = getSupabaseClient();
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      callback(toAuthSession(session));
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }
}
