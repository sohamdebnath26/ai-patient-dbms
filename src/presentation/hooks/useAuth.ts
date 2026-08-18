import { useAuthContext } from "@presentation/contexts/AuthContext";
import type { Credentials } from "@application/ports/IAuthRepository";
import type { AuthError } from "@domain/auth/AuthErrors";
import { useCallback } from "react";

export function useAuth() {
  const { state, service } = useAuthContext();

  const login = useCallback(
    async (credentials: Credentials): Promise<{ error: AuthError | null }> => {
      const { error } = await service.login(credentials);
      return { error };
    },
    [service],
  );

  const signup = useCallback(
    async (credentials: Credentials): Promise<{ error: AuthError | null }> => {
      const { error } = await service.signup(credentials);
      return { error };
    },
    [service],
  );

  const logout = useCallback(async () => {
    await service.logout();
  }, [service]);

  const deleteAccount = useCallback(async () => {
    await service.deleteAccount(state.user?.id ?? "");
  }, [service, state.user?.id]);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ error: AuthError | null }> => {
      const { error } = await service.requestPasswordReset(email);
      return { error };
    },
    [service],
  );

  const resetPassword = useCallback(
    async (accessToken: string, newPassword: string): Promise<{ error: AuthError | null }> => {
      const { error } = await service.resetPassword(accessToken, newPassword);
      return { error };
    },
    [service],
  );

  return {
    state,
    user: state.user,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    login,
    signup,
    logout,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
  };
}
