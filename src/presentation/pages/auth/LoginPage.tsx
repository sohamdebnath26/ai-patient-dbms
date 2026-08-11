import { useState } from "react";
import { useAuth } from "@presentation/hooks/useAuth";
import { Link, useNavigate } from "react-router";
import { Loader2, Activity } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    login({ email, password })
      .then(({ error: loginError }) => {
        if (loginError) {
          setError(loginError.message);
          setLoading(false);
          return;
        }
        void navigate("/dashboard");
      })
      .catch(() => {
        setError("An unexpected error occurred.");
        setLoading(false);
      });
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
          <h1 className="text-xl font-semibold text-gray-900">Sign in to ClinicOS AI</h1>
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/auth/forgot-password" className="text-brand-600 hover:text-brand-500">
            Forgot password?
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/auth/signup" className="text-brand-600 hover:text-brand-500 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
