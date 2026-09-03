import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { StatCard } from "@presentation/components/StatCard";
import {
  Users,
  Calendar,
  Stethoscope,
  CheckCircle2,
  UserPlus,
  Search,
  ArrowRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import { getSupabaseClient } from "@infrastructure/supabase/client";

function useAuthContext(): AuthorizationContext {
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
}

function useDashboardSummary(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "summary", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];

      const [patientCount, apptCount, encCount, completedCount] = await Promise.all([
        client
          .from("patients")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .eq(scope.column, scope.value)
          .then((r: unknown) => (r as { count: number }).count),
        client
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("appointment_date", today)
          .not("status", "in", '("cancelled","no_show")')
          .eq(scope.column, scope.value)
          .then((r: unknown) => (r as { count: number }).count),
        client
          .from("encounters")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress")
          .eq(scope.column, scope.value)
          .then((r: unknown) => (r as { count: number }).count),
        client
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("appointment_date", today)
          .eq("status", "completed")
          .eq(scope.column, scope.value)
          .then((r: unknown) => (r as { count: number }).count),
      ]);

      return {
        totalPatients: patientCount,
        todayAppointments: apptCount,
        activeEncounters: encCount,
        completedToday: completedCount,
      };
    },
  });
}

function useTodaySchedule(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "schedule", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];
      const { data } = (await client
        .from("appointments")
        .select("id,appointment_time,status,patient:patients(first_name,last_name,mrn)")
        .eq("appointment_date", today)
        .not("status", "in", '("cancelled","no_show")')
        .eq(scope.column, scope.value)
        .order("appointment_time", { ascending: true })
        .limit(8)) as unknown as {
        data:
          | {
              id: string;
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

function useRecentPatients(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "recentPatients", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data } = (await client
        .from("patients")
        .select("id,first_name,last_name,mrn,dob,gender,created_at")
        .neq("status", "deregistered")
        .eq(scope.column, scope.value)
        .order("created_at", { ascending: false })
        .limit(5)) as unknown as {
        data:
          | {
              id: string;
              first_name: string;
              last_name: string;
              mrn: string;
              dob: string | null;
              gender: string | null;
              created_at: string;
            }[]
          | null;
      };
      return data ?? [];
    },
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function calculateAge(dob: string | null): string {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / 31557600000)} yrs`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const auth = useAuthContext();
  const summary = useDashboardSummary(auth);
  const schedule = useTodaySchedule(auth);
  const recentPatients = useRecentPatients(auth);

  const s = summary.data;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              {getGreeting()}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Dr.{" "}
              {profile?.firstName
                ? `${profile.firstName} ${profile.lastName}`
                : (user?.email ?? "User")}
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Patients"
            value={s?.totalPatients}
            icon={Users}
            color="bg-blue-50 text-blue-600"
            loading={summary.isLoading}
          />
          <StatCard
            label="Today's Appointments"
            value={s?.todayAppointments}
            secondary={s?.todayAppointments ? `${s.completedToday} completed` : undefined}
            icon={Calendar}
            color="bg-emerald-50 text-emerald-600"
            loading={summary.isLoading}
          />
          <StatCard
            label="Active Encounters"
            value={s?.activeEncounters}
            icon={Stethoscope}
            color="bg-purple-50 text-purple-600"
            loading={summary.isLoading}
          />
          <StatCard
            label="Completed Today"
            value={s?.completedToday}
            icon={CheckCircle2}
            color="bg-amber-50 text-amber-600"
            loading={summary.isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Today&apos;s Schedule</h2>
                <button
                  onClick={() => {
                    void navigate("/appointments");
                  }}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm font-semibold"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {schedule.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-surface-50 flex animate-pulse items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-surface-200 h-10 w-14 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <div className="bg-surface-200 h-3 w-32 rounded" />
                        <div className="bg-surface-200 h-2.5 w-24 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : schedule.data && schedule.data.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="bg-surface-50 flex h-16 w-16 items-center justify-center rounded-full">
                    <Calendar className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">No appointments today</p>
                  <p className="mt-1 text-sm text-gray-500">Your schedule is clear</p>
                  <button
                    onClick={() => {
                      void navigate("/appointments/new");
                    }}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Book first appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {schedule.data?.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        void navigate(`/appointments/${a.id}`);
                      }}
                      className="flex cursor-pointer items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="bg-surface-50 flex h-12 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="mt-0.5 text-sm font-bold text-gray-800">
                          {a.appointment_time?.slice(0, 5) ?? "—"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {a.patient?.[0]?.first_name ?? "—"} {a.patient?.[0]?.last_name ?? ""}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          MRN: {a.patient?.[0]?.mrn ?? "—"} · {a.status.replace("_", " ")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Quick Actions</h2>
              <div>
                {[
                  {
                    label: "Register Patient",
                    desc: "Add a new patient record",
                    icon: UserPlus,
                    color: "bg-blue-50 text-blue-600",
                    to: "/patients/new",
                  },
                  {
                    label: "Find Patient",
                    desc: "Search patient records",
                    icon: Search,
                    color: "bg-emerald-50 text-emerald-600",
                    to: "/patients",
                  },
                  {
                    label: "New Appointment",
                    desc: "Book an appointment",
                    icon: Calendar,
                    color: "bg-purple-50 text-purple-600",
                    to: "/appointments/new",
                  },
                  {
                    label: "Start Consultation",
                    desc: "View clinical encounters",
                    icon: Stethoscope,
                    color: "bg-amber-50 text-amber-600",
                    to: "/encounters",
                  },
                ].map(({ label, desc, icon: Icon, color, to }) => (
                  <button
                    key={to}
                    onClick={() => {
                      void navigate(to);
                    }}
                    className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border-b border-gray-200 px-2 py-5 text-left transition last:border-b-0 hover:bg-gray-50"
                  >
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-900">{label}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-500">{desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-600" />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">Recent Patients</h2>
                  <button
                    onClick={() => {
                      void navigate("/patients/new");
                    }}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors"
                    title="Add Patient"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm font-semibold"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {recentPatients.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-surface-50 flex animate-pulse items-center gap-3 rounded-lg p-2.5"
                    >
                      <div className="bg-surface-200 h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="bg-surface-200 h-3 w-28 rounded" />
                        <div className="bg-surface-200 h-2.5 w-16 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPatients.data && recentPatients.data.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="bg-surface-50 flex h-16 w-16 items-center justify-center rounded-full">
                    <Users className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">No patients yet</p>
                  <button
                    onClick={() => {
                      void navigate("/patients/new");
                    }}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Register first patient
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentPatients.data?.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="flex cursor-pointer items-center gap-3 py-5 transition-colors first:pt-0 last:pb-0 hover:bg-gray-50"
                    >
                      <div className="bg-brand-50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        <span className="text-brand-600 text-sm font-bold">
                          {p.first_name.charAt(0)}
                          {p.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {calculateAge(p.dob)} · {p.gender ?? "—"} · MRN: {p.mrn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
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
