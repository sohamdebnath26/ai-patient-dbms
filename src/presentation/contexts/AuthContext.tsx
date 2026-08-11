import { createContext, useContext } from "react";
import type { AuthState } from "@domain/auth/AuthState";
import type { AuthService } from "@application/auth/AuthService";

export interface AuthContextValue {
  state: AuthState;
  service: AuthService;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
