import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useUpcomingAppointments } from "@presentation/hooks/useAppointments";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import {
  Users,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Plus,
  Calendar,
  Clock,
  UserCheck,
  ClipboardList,
  CalendarCheck,
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

function useActivePatientCount(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "activePatientCount", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { count, error } = (await client
        .from("patients")
        .select("*", { count: "exact", head: true })
        .neq("status", "deregistered")
        .eq(scope.column, scope.value)) as unknown as {
        count: number | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

function useTodayAppointmentCount(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["dashboard", "todayAppointmentCount", scope.column, scope.value, today],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { count, error } = (await client
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq(scope.column, scope.value)
        .eq("appointment_date", today)
        .not("status", "in", '("completed","cancelled","no_show")')) as unknown as {
        count: number | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return count ?? 0;
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
  if (!dob) return "\u2014";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / 31557600000)} yrs`;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-red-700">Unable to load</p>
      <p className="mt-1 text-xs text-red-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
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
  const recentPatients = useRecentPatients(auth);
  const upcomingAppointments = useUpcomingAppointments({ page: 1, limit: 10, hideCancelled: true });
  const activePatientCount = useActivePatientCount(auth);
  const todayAppointmentCount = useTodayAppointmentCount(auth);

  const displayName = profile?.firstName
    ? `Dr. ${profile.firstName} ${profile.lastName}`
    : user
      ? user.email.split("@")[0] || "User"
      : "User";

  function formatTime(time: string | null): string {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  function formatDateStr(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      in_progress: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`;
  };

  const statusDot = (status: string) => {
    const map: Record<string, string> = {
      scheduled: "bg-blue-500",
      confirmed: "bg-emerald-500",
      in_progress: "bg-amber-500",
    };
    return map[status] ?? "bg-gray-400";
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 shadow-md">
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
            {getGreeting()}, {displayName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            Here&apos;s what&apos;s happening
            <br />
            in your clinic today.
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <p className="text-sm font-medium text-indigo-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-200">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {activePatientCount.isLoading ? (
                    <span className="inline-block h-8 w-10 animate-pulse rounded-lg bg-blue-100" />
                  ) : (
                    (activePatientCount.data ?? 0)
                  )}
                </p>
                <p className="text-sm font-semibold text-blue-600">Active Patients</p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-md shadow-amber-200">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {todayAppointmentCount.isLoading ? (
                    <span className="inline-block h-8 w-10 animate-pulse rounded-lg bg-amber-100" />
                  ) : (
                    (todayAppointmentCount.data ?? 0)
                  )}
                </p>
                <p className="text-sm font-semibold text-amber-600">Due Today</p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-200">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {upcomingAppointments.isLoading ? (
                    <span className="inline-block h-8 w-10 animate-pulse rounded-lg bg-emerald-100" />
                  ) : (
                    (upcomingAppointments.data?.total ?? 0)
                  )}
                </p>
                <p className="text-sm font-semibold text-emerald-600">Upcoming</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-50 flex h-8 w-8 items-center justify-center rounded-lg">
                    <Users className="text-brand-600 h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Patients</h2>
                </div>
                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm font-semibold transition-colors"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {recentPatients.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex animate-pulse items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-gray-200" />
                        <div className="h-2.5 w-20 rounded bg-gray-200" />
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
                  <div className="bg-brand-50 flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Users className="text-brand-400 h-7 w-7" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">No patients yet</p>
                  <p className="mt-1 text-sm text-gray-400">Start by booking an appointment</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentPatients.data.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="hover:bg-brand-50/50 flex w-full items-center gap-3 py-4 text-left transition-colors first:pt-0 last:pb-0 hover:rounded-lg hover:px-3"
                    >
                      <div className="from-brand-100 to-brand-200 ring-brand-100 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-2">
                        <span className="text-brand-700 text-sm font-bold">
                          {p.first_name.charAt(0)}
                          {p.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs font-medium text-gray-400">
                          {computeAge(p.dob)} <span className="mx-1 text-gray-300">&middot;</span>{" "}
                          {p.gender ?? "\u2014"}{" "}
                          <span className="mx-1 text-gray-300">&middot;</span> MRN: {p.mrn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Upcoming Appointments</h2>
              </div>

              {upcomingAppointments.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex animate-pulse items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-gray-200" />
                        <div className="h-2.5 w-20 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingAppointments.isError ? (
                <SectionError
                  message={upcomingAppointments.error.message}
                  onRetry={() => {
                    void upcomingAppointments.refetch();
                  }}
                />
              ) : (upcomingAppointments.data?.appointments.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                    <Calendar className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-gray-900">No upcoming appointments</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Schedule a consultation from the patient record.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {upcomingAppointments.data.appointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => {
                          void navigate(`/appointments/${apt.id}`);
                        }}
                        className="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:rounded-lg hover:bg-indigo-50/50 hover:px-3"
                      >
                        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 ring-2 ring-indigo-100">
                          <span className="text-sm font-bold text-indigo-700">
                            {(apt.patient?.first_name ?? "?").charAt(0)}
                            {(apt.patient?.last_name ?? "").charAt(0)}
                          </span>
                          <span
                            className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${statusDot(apt.status)}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {apt.patient?.first_name ?? "Unknown"} {apt.patient?.last_name ?? ""}
                          </p>
                          <p className="text-xs font-medium text-gray-400">
                            {apt.patient?.mrn ?? "\u2014"}{" "}
                            <span className="mx-1 text-gray-300">&middot;</span>{" "}
                            {formatDateStr(apt.appointment_date)}
                            {apt.appointment_time && (
                              <>
                                {" "}
                                <span className="mx-1 text-gray-300">&middot;</span>{" "}
                                <Clock className="mr-0.5 inline h-3 w-3 text-gray-400" />
                                {formatTime(apt.appointment_time)}
                              </>
                            )}
                          </p>
                        </div>
                        <span className={statusBadge(apt.status)}>
                          {apt.status.replace("_", " ")}
                        </span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        void navigate("/appointments");
                      }}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                      View all &rarr;
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Plus className="h-4 w-4 text-violet-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    void navigate("/patients/new");
                  }}
                  className="from-brand-600 to-brand-700 shadow-brand-200 hover:from-brand-700 hover:to-brand-800 flex w-full items-center gap-3 rounded-xl bg-gradient-to-r px-4 py-3.5 text-left text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <p>New Appointment</p>
                    <p className="text-xs font-normal text-white/70">
                      Register a patient &amp; schedule
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-gray-700 shadow-sm transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p>Find Patient</p>
                    <p className="text-xs font-normal text-gray-400">Search &amp; manage records</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
