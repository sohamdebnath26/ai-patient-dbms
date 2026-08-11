import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useNavigate, NavLink } from "react-router";
import { RoleBadge } from "@presentation/components/RoleBadge";
import { LogOut, LayoutDashboard, User, Users, Calendar } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    void navigate("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
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
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"}`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </NavLink>
              <NavLink
                to="/patients"
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"}`
                }
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Patients</span>
              </NavLink>
              <NavLink
                to="/appointments"
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"}`
                }
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Appointments</span>
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"}`
                }
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {profile && <RoleBadge role={profile.role} />}
            <button
              onClick={() => {
                void handleLogout();
              }}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
