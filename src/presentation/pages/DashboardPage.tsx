import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useUpcomingAppointments } from "@presentation/hooks/useAppointments";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { useChat } from "@presentation/contexts/ChatContext";
import {
  Users,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  UserPlus,
  Calendar,
  Clock,
  UserCheck,
  ClipboardList,
  CalendarCheck,
  Bot,
  Zap,
  FileText,
  Stethoscope,
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
        .select("id,first_name,last_name,mrn,dob,gender,created_at,primary_diagnosis")
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
              primary_diagnosis: string | null;
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

function useRecentPrescriptions(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["dashboard", "recentPrescriptions", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = (await client
        .from("prescriptions")
        .select("id,patient_id,doctor_id,created_at,status,patients(first_name,last_name,mrn)")
        .eq(scope.column, scope.value)
        .order("created_at", { ascending: false })
        .limit(5)) as unknown as {
        data:
          | {
              id: string;
              patient_id: string;
              doctor_id: string;
              created_at: string;
              status: string;
              patients: {
                first_name: string;
                last_name: string;
                mrn: string;
              } | null;
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
  if (!dob) return "\u2014";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / 31557600000)} yrs`;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-800">Unable to load data</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Retry
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { setOpen: setChatOpen } = useChat();
  const auth = useAuthContext();
  const recentPatients = useRecentPatients(auth);
  const upcomingAppointments = useUpcomingAppointments({ page: 1, limit: 10, hideCancelled: true });
  const activePatientCount = useActivePatientCount(auth);
  const todayAppointmentCount = useTodayAppointmentCount(auth);
  const recentPrescriptions = useRecentPrescriptions(auth);

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
      scheduled: "bg-slate-100 text-slate-700 border-slate-200",
      confirmed: "bg-teal-50 text-teal-800 border-teal-200",
      in_progress: "bg-amber-50 text-amber-800 border-amber-200",
    };
    return `inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Banner */}
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
              {getGreeting()}, {displayName}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Dermatology Clinic Workspace
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void navigate("/patients/new");
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Patient
            </button>
            <button
              type="button"
              onClick={() => {
                void navigate("/patients/new");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Walk-in Patient
            </button>
            <button
              type="button"
              onClick={() => {
                setChatOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100"
            >
              <Bot className="h-3.5 w-3.5 text-teal-600" />
              AI Assistant
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Patients</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-teal-50 text-teal-700">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {activePatientCount.isLoading ? "—" : (activePatientCount.data ?? 0)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">Total active records</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Due Today</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-50 text-amber-700">
                <ClipboardList className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {todayAppointmentCount.isLoading ? "—" : (todayAppointmentCount.data ?? 0)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">Consultations scheduled</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Upcoming Appointments</span>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-700">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {upcomingAppointments.isLoading ? "—" : (upcomingAppointments.data?.total ?? 0)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">Confirmed in schedule</p>
          </div>
        </div>

        {/* Clinical Workspace Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main 2-column section */}
          <div className="space-y-6 lg:col-span-2">
            {/* Upcoming Appointments */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Today &amp; Upcoming Schedule
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigate("/appointments");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {upcomingAppointments.isLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
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
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming appointments scheduled.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingAppointments.data.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between py-2.5 text-xs hover:bg-slate-50/80"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-slate-100 font-bold text-slate-700">
                          {(apt.patient?.first_name ?? "?").charAt(0)}
                          {(apt.patient?.last_name ?? "").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              void navigate(`/patients/${apt.patient_id}`);
                            }}
                            className="block truncate text-left font-semibold text-slate-900 hover:text-teal-700"
                          >
                            {apt.patient?.first_name ?? "Patient"} {apt.patient?.last_name ?? ""}
                          </button>
                          <p className="text-[11px] text-slate-400">
                            MRN: {apt.patient?.mrn ?? "—"} &middot;{" "}
                            {formatDateStr(apt.appointment_date)}
                            {apt.appointment_time && (
                              <>
                                {" "}
                                &middot; <Clock className="inline h-3 w-3 text-slate-400" />{" "}
                                {formatTime(apt.appointment_time)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={statusBadge(apt.status)}>
                          {apt.status.replace("_", " ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigate(`/patients/${apt.patient_id}/edit`);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100"
                        >
                          <Stethoscope className="h-3 w-3" />
                          Consult
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Added Patients */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Recently Registered Patients</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {recentPatients.isLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
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
                <div className="py-8 text-center text-xs text-slate-400">
                  No patient records registered yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentPatients.data.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="flex w-full items-center justify-between py-2.5 text-left text-xs hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-teal-50 font-bold text-teal-800">
                          {p.first_name.charAt(0)}
                          {p.last_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {computeAge(p.dob)} &middot; {p.gender ?? "—"} &middot; MRN: {p.mrn}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar 1-column section */}
          <div className="space-y-6">
            {/* Quick Actions Panel */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Clinical Actions
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    void navigate("/patients/new");
                  }}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Walk-in Patient Entry
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-600" />
                    Patient Directory
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Prescriptions & Clinical Activity */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Recent Rx Activity
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigate("/appointments");
                  }}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800"
                >
                  View all
                </button>
              </div>

              {recentPrescriptions.isLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
                  ))}
                </div>
              ) : recentPrescriptions.isError ? (
                <p className="py-2 text-[11px] text-slate-400">Unable to fetch activity.</p>
              ) : (recentPrescriptions.data?.length ?? 0) === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  No recent prescription records found.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentPrescriptions.data.map((rx) => (
                    <div key={rx.id} className="py-2 text-xs">
                      <p className="font-semibold text-slate-800">
                        {rx.patients
                          ? `${rx.patients.first_name} ${rx.patients.last_name}`
                          : "Patient"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {rx.patients?.mrn ? `MRN: ${rx.patients.mrn} · ` : ""}
                        {formatDateStr(rx.created_at)}
                      </p>
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
