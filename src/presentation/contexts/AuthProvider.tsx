import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { AuthStatus, AuthState } from "@domain/auth/AuthState";
import type { User } from "@domain/auth/User";
import type { AuthSession } from "@domain/auth/User";
import { AuthService } from "@application/auth/AuthService";
import { SupabaseAuthRepository } from "@infrastructure/supabase/auth/SupabaseAuthRepository";
import { AuthContext } from "../contexts/AuthContext";

const authRepository = new SupabaseAuthRepository();
const authService = new AuthService(authRepository);

function getInitialStatus(): AuthStatus {
  return "loading";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: getInitialStatus(),
    user: null,
    error: null,
  });

  const updateState = useCallback(
    (patch: { status?: AuthStatus; user?: User | null; error?: string | null }) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { session, error } = await authService.getSession();
      if (cancelled) return;

      if (error) {
        if (error.code === "network-error") {
          updateState({ status: "unauthenticated", error: error.message });
        } else {
          updateState({ status: "unauthenticated" });
        }
        return;
      }

      if (session) {
        updateState({ status: "authenticated", user: session.user });
      } else {
        updateState({ status: "unauthenticated" });
      }
    }

    const unsubscribe = authService.onAuthStateChange((session: AuthSession | null) => {
      if (cancelled) return;
      if (session) {
        updateState({ status: "authenticated", user: session.user });
      } else {
        updateState({ status: "unauthenticated", user: null });
      }
    });

    void init();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [updateState]);

  const contextValue = useMemo(() => ({ state, service: authService }), [state]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
