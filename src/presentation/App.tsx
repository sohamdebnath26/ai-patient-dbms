import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "@presentation/contexts/AuthProvider";
import { ProtectedRoute } from "@presentation/components/ProtectedRoute";
import { HealthPage } from "@presentation/pages/system/HealthPage";
import { LoginPage } from "@presentation/pages/auth/LoginPage";
import { SignupPage } from "@presentation/pages/auth/SignupPage";
import { ForgotPasswordPage } from "@presentation/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@presentation/pages/auth/ResetPasswordPage";
import { DashboardPage } from "@presentation/pages/DashboardPage";
import { ProfilePage } from "@presentation/pages/profile/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="bg-brand-600 flex h-12 w-12 items-center justify-center rounded-xl text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">ClinicOS AI</h1>
        <p className="mt-2 text-gray-500">AI Patient Database Management System</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="/auth/login"
            className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </a>
          <a
            href="/auth/signup"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/system/health" element={<HealthPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
