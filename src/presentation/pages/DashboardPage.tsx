import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { RoleBadge } from "@presentation/components/RoleBadge";
import {
  Users,
  Calendar,
  Stethoscope,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { getSupabaseClient } from "@infrastructure/supabase/client";

interface DashboardSummary {
  totalPatients: number;
  todayAppointments: number;
  activeEncounters: number;
}

function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async (): Promise<DashboardSummary> => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];

      const [patientCount, appointmentCount, encounterCount] = await Promise.all([
        client
          .from("patients")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .then((r: unknown) => (r as { count: number }).count),
        client
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("appointment_date", today)
          .not("status", "in", '("cancelled","no_show")')
          .then((r: unknown) => (r as { count: number }).count),
        client
          .from("encounters")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress")
          .then((r: unknown) => (r as { count: number }).count),
      ]);

      return {
        totalPatients: patientCount,
        todayAppointments: appointmentCount,
        activeEncounters: encounterCount,
      };
    },
  });
}

function useRecentPatients() {
  return useQuery({
    queryKey: ["dashboard", "recentPatients"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data } = (await client
        .from("patients")
        .select("id,first_name,last_name,mrn,created_at")
        .order("created_at", { ascending: false })
        .limit(5)) as unknown as {
        data:
          | { id: string; first_name: string; last_name: string; mrn: string; created_at: string }[]
          | null;
      };
      return data ?? [];
    },
  });
}

function useUpcomingAppointments() {
  return useQuery({
    queryKey: ["dashboard", "upcomingAppointments"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];
      const { data } = (await client
        .from("appointments")
        .select(
          "id,appointment_date,appointment_time,status,patient:patients(first_name,last_name,mrn)",
        )
        .gte("appointment_date", today)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true })
        .limit(5)) as unknown as {
        data:
          | {
              id: string;
              appointment_date: string;
              appointment_time: string | null;
              status: string;
              patient: { first_name: string; last_name: string; mrn: string }[] | null;
            }[]
          | null;
      };
      return data ?? [];
    },
  });
}

const summaryCards = [
  { key: "totalPatients", label: "Total Patients", icon: Users, color: "bg-blue-50 text-blue-600" },
  {
    key: "todayAppointments",
    label: "Today's Appointments",
    icon: Calendar,
    color: "bg-green-50 text-green-600",
  },
  {
    key: "activeEncounters",
    label: "Active Encounters",
    icon: Stethoscope,
    color: "bg-purple-50 text-purple-600",
  },
] as const;

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const summary = useDashboardSummary();
  const recentPatients = useRecentPatients();
  const upcoming = useUpcomingAppointments();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome{profile?.firstName ? `, ${profile.firstName}` : ""}
            </h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          {profile && <RoleBadge role={profile.role} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  {summary.isLoading ? (
                    <Loader2 className="mt-1 h-5 w-5 animate-spin text-gray-400" />
                  ) : summary.isError ? (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" /> Error
                    </div>
                  ) : (
                    <p className="mt-1 text-3xl font-bold text-gray-900">{summary.data?.[key]}</p>
                  )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => {
                  void navigate("/patients/new");
                }}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Register Patient</p>
                  <p className="text-xs text-gray-500">Add a new patient record</p>
                </div>
              </button>
              <button
                onClick={() => {
                  void navigate("/patients");
                }}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Find Patient</p>
                  <p className="text-xs text-gray-500">Search patient records</p>
                </div>
              </button>
              <button
                onClick={() => {
                  void navigate("/appointments/new");
                }}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Appointment</p>
                  <p className="text-xs text-gray-500">Book an appointment</p>
                </div>
              </button>
              <button
                onClick={() => {
                  void navigate("/appointments");
                }}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                  <ClipboardList className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Appointments</p>
                  <p className="text-xs text-gray-500">View all appointments</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
                <button
                  onClick={() => {
                    void navigate("/appointments");
                  }}
                  className="text-brand-600 hover:text-brand-500 flex items-center gap-1 text-xs font-medium"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {upcoming.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : upcoming.data && upcoming.data.length === 0 ? (
                <div className="py-6 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-500">No upcoming appointments</p>
                  <button
                    onClick={() => {
                      void navigate("/appointments/new");
                    }}
                    className="text-brand-600 hover:text-brand-500 mt-1 text-sm font-medium"
                  >
                    Book first appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.data?.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        void navigate(`/appointments/${a.id}`);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {a.patient?.[0]?.first_name ?? "—"} {a.patient?.[0]?.last_name ?? ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {a.appointment_date}{" "}
                          {a.appointment_time ? `at ${a.appointment_time}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Patients</h2>
                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="text-brand-600 hover:text-brand-500 flex items-center gap-1 text-xs font-medium"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {recentPatients.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : recentPatients.data && recentPatients.data.length === 0 ? (
                <div className="py-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-500">No patients yet</p>
                  <button
                    onClick={() => {
                      void navigate("/patients/new");
                    }}
                    className="text-brand-600 hover:text-brand-500 mt-1 flex items-center gap-1 text-sm font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> Register first patient
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPatients.data?.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-md py-1.5 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-50 flex h-8 w-8 items-center justify-center rounded-full">
                          <span className="text-brand-600 text-xs font-medium">
                            {p.first_name.charAt(0)}
                            {p.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{p.mrn}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
