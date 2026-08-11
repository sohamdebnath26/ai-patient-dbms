import { useState } from "react";
import { useAuth } from "@presentation/hooks/useAuth";
import { Link } from "react-router";
import { Loader2, Activity, CheckCircle2 } from "lucide-react";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    requestPasswordReset(email)
      .then(({ error: resetError }) => {
        setLoading(false);
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setSent(true);
      })
      .catch(() => {
        setError("An unexpected error occurred.");
        setLoading(false);
      });
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle2 className="text-clinical-500 mx-auto h-12 w-12" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Check your email</h1>
          <p className="mt-2 text-sm text-gray-500">
            If an account exists for <span className="font-medium text-gray-900">{email}</span>, we
            sent a password reset link.
          </p>
          <Link
            to="/auth/login"
            className="text-brand-600 hover:text-brand-500 mt-6 inline-block text-sm font-medium"
          >
            Back to sign in
          </Link>
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
          <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
              placeholder="you@clinic.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/auth/login" className="text-brand-600 hover:text-brand-500 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
