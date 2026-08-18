import { useState, useMemo } from "react";
import { useProfile } from "@presentation/hooks/useProfile";
import { useNavigate, NavLink, useLocation } from "react-router";
import { usePatientList } from "@presentation/hooks/usePatients";
import { useChat } from "@presentation/contexts/ChatContext";
import { useLogout } from "@presentation/hooks/useLogout";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Image,
  Sparkles,
  FileText,
  User,
  LogOut,
  Menu,
  Search,
  ChevronRight,
  Bell,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, addAction: null },
  { to: "/patients", label: "Patients", icon: Users, addAction: "/patients/new" },
  { to: "/appointments", label: "Appointments", icon: Calendar, addAction: "/appointments/new" },
  { to: "/encounters", label: "Encounters", icon: Stethoscope, disabled: true, addAction: null },
  { to: "/images", label: "Medical Images", icon: Image, disabled: true, addAction: null },
  { to: "/ai", label: "AI Assistant", icon: Sparkles, disabled: false, addAction: null },
  { to: "/reports", label: "Reports", icon: FileText, disabled: true, addAction: null },
  { to: "/profile", label: "Profile", icon: User, addAction: null },
  { to: "/settings", label: "Settings", icon: Settings, addAction: null },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: searchResults } = usePatientList({
    page: 1,
    limit: 5,
    query: searchFocused ? searchQuery : undefined,
  });

  const { setOpen: setChatOpen } = useChat();

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
    <div className="bg-surface-100 flex h-screen overflow-hidden">
      <aside
        className={`border-surface-200 fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-surface-200 flex h-14 items-center gap-3 border-b px-5">
            <div className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-lg">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-gray-900">ClinicOS</span>
              <span className="text-brand-600 text-xs font-medium"> AI</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-3 px-2">
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                Main Menu
              </p>
            </div>
            <ul className="space-y-0.5">
              {navItems.slice(0, 3).map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => {
                      setSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "hover:bg-surface-50 text-gray-600 hover:text-gray-900"
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-6 mb-3 px-2">
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                Clinical
              </p>
            </div>
            <ul className="space-y-0.5">
              {navItems.slice(3, 7).map(({ to, label, icon: Icon, disabled }) => {
                if (label === "AI Assistant") {
                  return (
                    <li key={to}>
                      <button
                        onClick={() => {
                          setChatOpen(true);
                        }}
                        className="hover:bg-surface-50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                      >
                        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {label}
                      </button>
                    </li>
                  );
                }
                if (disabled) {
                  return (
                    <li key={to}>
                      <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300">
                        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {label}
                        <span className="bg-surface-100 ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => {
                        setSidebarOpen(false);
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-brand-50 text-brand-700"
                            : "hover:bg-surface-50 text-gray-600 hover:text-gray-900"
                        }`
                      }
                    >
                      <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 mb-3 px-2">
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                Account
              </p>
            </div>
            <ul className="space-y-0.5">
              {navItems.slice(7).map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => {
                      setSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "hover:bg-surface-50 text-gray-600 hover:text-gray-900"
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-surface-200 border-t p-4">
            <div className="bg-surface-50 flex items-center gap-3 rounded-lg p-3">
              <div className="bg-brand-100 flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-brand-600 text-xs font-bold">{avatarLetter}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900">{displayName}</p>
                <p className="text-[11px] text-gray-500 capitalize">
                  {profile?.role ?? "Loading..."}
                </p>
              </div>
              <button
                onClick={() => {
                  void handleLogout();
                }}
                className="hover:bg-surface-100 rounded-md p-1.5 text-gray-400 hover:text-red-500"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => {
            setSidebarOpen(false);
          }}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-surface-200 flex h-14 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSidebarOpen(true);
              }}
              className="hover:bg-surface-100 rounded-md p-1.5 text-gray-400 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm text-gray-400 sm:flex">
              {location.pathname
                .split("/")
                .filter(Boolean)
                .map((segment, i, arr) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    <span
                      className={
                        i === arr.length - 1 ? "font-medium text-gray-700 capitalize" : "capitalize"
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
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
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
                placeholder="Search patients..."
                className="border-surface-200 bg-surface-50 focus:border-brand-300 focus:ring-brand-100 w-64 rounded-lg border py-1.5 pr-3 pl-9 text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:outline-none"
              />
              {searchFocused && searchResults && searchResults.patients.length > 0 && (
                <div className="border-surface-200 absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border bg-white shadow-lg">
                  {searchResults.patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                        setSearchFocused(false);
                        setSearchQuery("");
                      }}
                      className="hover:bg-surface-50 flex w-full items-center gap-3 px-4 py-2.5 text-left first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="bg-brand-50 flex h-7 w-7 items-center justify-center rounded-full">
                        <span className="text-brand-600 text-[10px] font-bold">
                          {p.first_name.charAt(0)}
                          {p.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-gray-400">MRN: {p.mrn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <button className="hover:bg-surface-100 relative rounded-lg p-2 text-gray-400">
              <Bell className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
