import { useState, useEffect } from "react";
import { useAuth } from "@presentation/hooks/useAuth";
import { Link, useNavigate } from "react-router";
import { Loader2, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

export function ResetPasswordPage() {
  const { resetPassword, isAuthenticated, isLoading, isPasswordRecovery, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [notRecovery, setNotRecovery] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPasswordRecovery) {
      setNotRecovery(true);
    }
    if (!isLoading && !isAuthenticated) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [isLoading, isAuthenticated, isPasswordRecovery]);

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    resetPassword(password)
      .then(async ({ error: resetError }) => {
        setSubmitting(false);
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setDone(true);
        await logout();
        setTimeout(() => {
          void navigate("/auth/login");
        }, 3000);
      })
      .catch(() => {
        setError("An unexpected error occurred.");
        setSubmitting(false);
      });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle2 className="text-clinical-500 mx-auto h-12 w-12" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Password updated</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your password has been reset. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Set new password</h1>
        </div>

        {notRecovery && !error && (
          <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                This page is for password recovery only. Please use the link from your email.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        {isAuthenticated && isPasswordRecovery && !error && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                }}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/auth/login" className="text-brand-600 hover:text-brand-500 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
