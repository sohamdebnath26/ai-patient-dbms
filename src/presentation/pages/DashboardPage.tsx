import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useNavigate } from "react-router";
import { RoleBadge } from "@presentation/components/RoleBadge";
import { LogOut, User, LayoutDashboard, Users, Stethoscope, Headphones, Pill } from "lucide-react";

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Users className="h-5 w-5" />,
  doctor: <Stethoscope className="h-5 w-5" />,
  receptionist: <Headphones className="h-5 w-5" />,
  pharmacist: <Pill className="h-5 w-5" />,
  patient: <User className="h-5 w-5" />,
};

export function DashboardPage() {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    void navigate("/auth/login");
  }

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "Welcome";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-md">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">ClinicOS AI</span>
            <nav className="ml-4 flex items-center gap-1 text-sm">
              <button className="bg-brand-50 text-brand-700 flex items-center gap-1 rounded-md px-3 py-1.5">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => void navigate("/profile")}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              {profile?.role === "admin" && (
                <button
                  onClick={() => void navigate("/admin")}
                  className="flex items-center gap-1 rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {profile && <RoleBadge role={profile.role} />}
            <button
              onClick={() => void handleLogout()}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              {profile ? (
                <span className="text-brand-600 text-3xl font-semibold">
                  {profile.email.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
            {profile && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <RoleBadge role={profile.role} />
              </div>
            )}
            {profile && (
              <p className="mt-4 text-sm text-gray-500">
                You are signed in as a <strong>{profile.role}</strong>.
                {profile.role === "admin" && " You can manage users and view audit logs."}
                {profile.role === "doctor" && " You can manage patients and clinical notes."}
                {profile.role === "receptionist" &&
                  " You can register patients and manage appointments."}
                {profile.role === "pharmacist" && " You can manage medications and prescriptions."}
                {profile.role === "patient" &&
                  " You can view your health records and appointments."}
              </p>
            )}
          </div>

          {profile && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => void navigate("/profile")}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  {roleIcons[profile.role] ?? <User className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">My Profile</p>
                  <p className="text-xs text-gray-500">View and edit your profile</p>
                </div>
              </button>
              {profile.role === "admin" && (
                <button
                  onClick={() => void navigate("/admin")}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Admin Panel</p>
                    <p className="text-xs text-gray-500">Manage users and settings</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
