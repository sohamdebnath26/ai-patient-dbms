import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import {
  Users,
  Calendar,
  Stethoscope,
  Clock,
  ChevronRight,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Plus,
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
          .neq("status", "deregistered")
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
    staleTime: 30_000,
  });
}

function useTodayAppointments(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "schedule", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = (await client
        .from("appointments")
        .select("id,appointment_time,status,reason,type,patient:patients(first_name,last_name,mrn)")
        .eq("appointment_date", today)
        .not("status", "in", '("cancelled","no_show")')
        .eq(scope.column, scope.value)
        .order("appointment_time", { ascending: true })
        .limit(10)) as unknown as {
        data:
          | {
              id: string;
              appointment_time: string | null;
              status: string;
              reason: string | null;
              type: string;
              patient: { first_name: string; last_name: string; mrn: string } | null;
            }[]
          | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

function useRecentPatients(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "recentPatients", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = (await client
        .from("patients")
        .select("id,first_name,last_name,mrn,dob,gender")
        .neq("status", "deregistered")
        .eq(scope.column, scope.value)
        .order("updated_at", { ascending: false })
        .limit(5)) as unknown as {
        data:
          | {
              id: string;
              first_name: string;
              last_name: string;
              mrn: string;
              dob: string | null;
              gender: string | null;
            }[]
          | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function computeAge(dob: string | null): string {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / 31557600000)} yrs`;
}

function StatCardDisplay({
  label,
  value,
  loading,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{label}</p>
          <div className="mt-4 min-h-[44px]">
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
            ) : (
              <p className="text-[44px] leading-none font-extrabold tracking-tight text-gray-900">
                {value?.toLocaleString() ?? 0}
              </p>
            )}
          </div>
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-red-400" />
      <p className="mt-3 text-sm font-medium text-red-600">Unable to load</p>
      <p className="mt-1 text-xs text-gray-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Try again
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const auth = useAuthContext();
  const summary = useDashboardSummary(auth);
  const schedule = useTodayAppointments(auth);
  const recentPatients = useRecentPatients(auth);

  const s = summary.data;

  const displayName = profile?.firstName
    ? `Dr. ${profile.firstName} ${profile.lastName}`
    : user
      ? user.email.split("@")[0] || "User"
      : "User";

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            {getGreeting()}, {displayName}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Here&apos;s what&apos;s happening in your clinic today.
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardDisplay
            label="Active Patients"
            value={s?.totalPatients}
            loading={summary.isLoading}
            icon={Users}
            color="bg-blue-50 text-blue-600"
          />
          <StatCardDisplay
            label="Today's Appointments"
            value={s?.todayAppointments}
            loading={summary.isLoading}
            icon={Calendar}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCardDisplay
            label="Active Consultations"
            value={s?.activeEncounters}
            loading={summary.isLoading}
            icon={Stethoscope}
            color="bg-purple-50 text-purple-600"
          />
          <StatCardDisplay
            label="Completed Today"
            value={s?.completedToday}
            loading={summary.isLoading}
            icon={Calendar}
            color="bg-amber-50 text-amber-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Today&apos;s Appointments</h2>
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
                      className="flex animate-pulse items-center gap-4 rounded-lg bg-gray-50 p-3"
                    >
                      <div className="h-10 w-14 rounded-md bg-gray-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 rounded bg-gray-200" />
                        <div className="h-2.5 w-24 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : schedule.isError ? (
                <SectionError
                  message={schedule.error.message}
                  onRetry={() => {
                    void schedule.refetch();
                  }}
                />
              ) : (schedule.data?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                    <Calendar className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">No appointments today</p>
                  <p className="mt-1 text-sm text-gray-500">Your schedule is clear</p>
                  <button
                    onClick={() => {
                      void navigate("/appointments/new");
                    }}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 rounded-xl px-5 py-2 text-sm font-semibold text-white"
                  >
                    Book appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {schedule.data.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        void navigate(`/appointments/${a.id}`);
                      }}
                      className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-12 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gray-50">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="mt-0.5 text-sm font-bold text-gray-800">
                          {a.appointment_time?.slice(0, 5) ?? "—"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : "Patient"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {a.patient?.mrn ? `MRN: ${a.patient.mrn} · ` : ""}
                          {a.reason || a.type.replace("_", " ")} · {a.status.replace("_", " ")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Patients</h2>
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
                      className="flex animate-pulse items-center gap-3 rounded-lg bg-gray-50 p-2.5"
                    >
                      <div className="h-9 w-9 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-28 rounded bg-gray-200" />
                        <div className="h-2.5 w-16 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPatients.isError ? (
                <SectionError
                  message={recentPatients.error.message}
                  onRetry={() => {
                    void recentPatients.refetch();
                  }}
                />
              ) : (recentPatients.data?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                    <Users className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">No patients yet</p>
                  <p className="mt-1 text-sm text-gray-500">Start by booking an appointment</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentPatients.data.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="flex w-full items-center gap-3 py-4 text-left first:pt-0 last:pb-0 hover:bg-gray-50"
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
                        <p className="text-xs text-gray-500">
                          {computeAge(p.dob)} · {p.gender ?? "—"} · MRN: {p.mrn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-gray-900">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    void navigate("/appointments/new");
                  }}
                  className="bg-brand-600 hover:bg-brand-700 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white"
                >
                  <Plus className="h-5 w-5" />
                  New Appointment
                </button>
                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Users className="h-5 w-5 text-gray-400" />
                  Find Patient
                </button>
                <button
                  onClick={() => {
                    void navigate("/encounters");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Stethoscope className="h-5 w-5 text-gray-400" />
                  View Consultations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
