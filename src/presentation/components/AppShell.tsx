import { useState, useMemo } from "react";
import { Toaster } from "@presentation/components/Toaster";
import { useProfile } from "@presentation/hooks/useProfile";
import { useNavigate, NavLink, useLocation } from "react-router";
import { usePatientList } from "@presentation/hooks/usePatients";
import { useLogout } from "@presentation/hooks/useLogout";
import { useChat } from "@presentation/contexts/ChatContext";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Pill,
  Bot,
  Settings,
  Menu,
  Search,
  ChevronRight,
  Bell,
  LogOut,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = useLogout();
  const { setOpen: setChatOpen } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: searchResults } = usePatientList({
    page: 1,
    limit: 5,
    query: searchFocused ? searchQuery : undefined,
  });

  const avatarLetter = useMemo(() => {
    if (profile?.firstName) return profile.firstName.charAt(0).toUpperCase();
    if (profile?.email) return profile.email.charAt(0).toUpperCase();
    return "?";
  }, [profile?.firstName, profile?.email]);

  const displayName = useMemo(() => {
    if (profile?.firstName) return `Dr. ${profile.firstName} ${profile.lastName}`;
    return profile?.email ?? "User";
  }, [profile?.firstName, profile?.lastName, profile?.email]);

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchQuery.trim()) {
      void navigate(`/patients?query=${encodeURIComponent(searchQuery)}`);
      setSearchFocused(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      <Toaster />
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 transform border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">ClinicOS</span>
              <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-teal-700 uppercase">
                Derm
              </span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-2 px-2">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Clinical Workflow
              </p>
            </div>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/dashboard"
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">Dashboard</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/patients"
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">Patients</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/patients/new"
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <UserPlus className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">Add Patient</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/appointments"
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Pill className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">Prescriptions</span>
                </NavLink>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    setChatOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <Bot className="h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span className="flex-1">AI Assistant</span>
                </button>
              </li>

              <li>
                <NavLink
                  to="/settings"
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">Settings</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="border-t border-slate-200 p-3">
            <div className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-100 text-xs font-bold text-teal-800">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
                <p className="text-[10px] text-slate-500 capitalize">
                  {profile?.role ?? "Clinician"}
                </p>
              </div>
              <button
                onClick={() => {
                  void handleLogout();
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
          onClick={() => {
            setSidebarOpen(false);
          }}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSidebarOpen(true);
              }}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
              {location.pathname
                .split("/")
                .filter(Boolean)
                .map((segment, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                    <span
                      className={
                        i === arr.length - 1
                          ? "font-semibold text-slate-700 capitalize"
                          : "capitalize"
                      }
                    >
                      {segment.replace(/-/g, " ")}
                    </span>
                  </span>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setSearchFocused(false);
                  }, 200);
                }}
                placeholder="Search MRN or patient name..."
                className="w-60 rounded-md border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
              {searchFocused && searchResults && searchResults.patients.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-slate-200 bg-white py-1 shadow-md">
                  {searchResults.patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                        setSearchFocused(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-50 text-[10px] font-bold text-teal-700">
                        {p.first_name.charAt(0)}
                        {p.last_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-900">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400">MRN: {p.mrn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <button
              className="relative rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
