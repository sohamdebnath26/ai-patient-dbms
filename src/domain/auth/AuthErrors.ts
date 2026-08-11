export type AuthErrorCode =
  | "invalid-credentials"
  | "email-not-verified"
  | "session-expired"
  | "token-refresh-failed"
  | "network-error"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export function mapSupabaseError(error: Error): AuthError {
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return { code: "invalid-credentials", message: "Invalid email or password." };
  }
  if (msg.includes("email not confirmed")) {
    return {
      code: "email-not-verified",
      message: "Please verify your email address before signing in.",
    };
  }
  if (msg.includes("jwt expired") || msg.includes("session expired")) {
    return { code: "session-expired", message: "Your session has expired. Please sign in again." };
  }
  if (msg.includes("refresh") || msg.includes("token")) {
    return {
      code: "token-refresh-failed",
      message: "Unable to refresh your session. Please sign in again.",
    };
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("timeout")) {
    return {
      code: "network-error",
      message: "A network error occurred. Please check your connection.",
    };
  }

  return { code: "unknown", message: error.message };
}
