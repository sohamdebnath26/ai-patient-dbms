import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
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

function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];

      const [patientCount, apptCount, encCount, completedCount] = await Promise.all([
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
        client
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("appointment_date", today)
          .eq("status", "completed")
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

function useTodaySchedule() {
  return useQuery({
    queryKey: ["dashboard", "schedule"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];
      const { data } = (await client
        .from("appointments")
        .select("id,appointment_time,status,patient:patients(first_name,last_name,mrn)")
        .eq("appointment_date", today)
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

function useRecentEncounters() {
  return useQuery({
    queryKey: ["dashboard", "recentEncounters"],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data } = (await client
        .from("encounters")
        .select("id,status,chief_complaint,encounter_date,patient:patients(first_name,last_name)")
        .order("created_at", { ascending: false })
        .limit(5)) as unknown as {
        data:
          | {
              id: string;
              status: string;
              chief_complaint: string | null;
              encounter_date: string;
              patient: { first_name: string; last_name: string }[] | null;
            }[]
          | null;
      };
      return data ?? [];
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
        .select("id,first_name,last_name,mrn,dob,gender,created_at")
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
  const summary = useDashboardSummary();
  const schedule = useTodaySchedule();
  const encounters = useRecentEncounters();
  const recentPatients = useRecentPatients();

  const s = summary.data;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              {getGreeting()}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Dr.{" "}
              {profile?.firstName
                ? `${profile.firstName} ${profile.lastName}`
                : (user?.email ?? "User")}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Patients"
            value={s?.totalPatients}
            icon={Users}
            color="bg-blue-50 text-blue-600"
            loading={summary.isLoading}
          />
          <StatCard
            label="Today's Appts"
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
            <div className="border-surface-200 rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Today&apos;s Schedule</h2>
                <button
                  onClick={() => {
                    void navigate("/appointments");
                  }}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-xs font-medium"
                >
                  View all <ArrowRight className="h-3 w-3" />
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
                <div className="py-10 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-500">No appointments today</p>
                  <button
                    onClick={() => {
                      void navigate("/appointments/new");
                    }}
                    className="text-brand-600 hover:text-brand-700 mt-1 text-sm font-medium"
                  >
                    Book first appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {schedule.data?.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        void navigate(`/appointments/${a.id}`);
                      }}
                      className="hover:bg-surface-50 flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2.5 transition-colors"
                    >
                      <div className="bg-surface-50 flex h-11 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="mt-0.5 text-xs font-semibold text-gray-700">
                          {a.appointment_time?.slice(0, 5) ?? "—"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {a.patient?.[0]?.first_name ?? "—"} {a.patient?.[0]?.last_name ?? ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          MRN: {a.patient?.[0]?.mrn ?? "—"} · {a.status.replace("_", " ")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-surface-200 rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Recent Encounters</h2>
                <button
                  onClick={() => {
                    void navigate("/encounters");
                  }}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-xs font-medium"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {encounters.isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-surface-50 flex animate-pulse items-center gap-3 rounded-lg p-3"
                    >
                      <div className="bg-surface-200 h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="bg-surface-200 h-3 w-36 rounded" />
                        <div className="bg-surface-200 h-2.5 w-24 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : encounters.data && encounters.data.length === 0 ? (
                <div className="py-8 text-center">
                  <Stethoscope className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-500">No encounters yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {encounters.data?.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        void navigate(`/encounters/${e.id}`);
                      }}
                      className="hover:bg-surface-50 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                          e.status === "in_progress"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-surface-100 text-gray-400"
                        }`}
                      >
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {e.patient?.[0]?.first_name ?? "—"} {e.patient?.[0]?.last_name ?? ""}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {e.chief_complaint || "No complaint recorded"} ·{" "}
                          <span
                            className={
                              e.status === "in_progress" ? "font-medium text-purple-600" : ""
                            }
                          >
                            {e.status.replace("_", " ")}
                          </span>
                        </p>
                      </div>
                      <span className="text-brand-600 text-xs font-medium">
                        {e.status === "in_progress" ? "Continue" : "View"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-surface-200 rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Quick Actions</h2>
              <div className="space-y-2">
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
                    desc: "Begin a new encounter",
                    icon: Stethoscope,
                    color: "bg-amber-50 text-amber-600",
                    to: "/appointments",
                  },
                ].map(({ label, desc, icon: Icon, color, to }) => (
                  <button
                    key={to}
                    onClick={() => {
                      void navigate(to);
                    }}
                    className="hover:bg-surface-50 flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors"
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-surface-200 rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Recent Patients</h2>
                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-xs font-medium"
                >
                  View all <ArrowRight className="h-3 w-3" />
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
                <div className="py-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-500">No patients yet</p>
                  <button
                    onClick={() => {
                      void navigate("/patients/new");
                    }}
                    className="text-brand-600 hover:text-brand-700 mt-1 text-sm font-medium"
                  >
                    Register first patient
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentPatients.data?.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="hover:bg-surface-50 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors"
                    >
                      <div className="bg-brand-50 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full">
                        <span className="text-brand-600 text-xs font-bold">
                          {p.first_name.charAt(0)}
                          {p.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {calculateAge(p.dob)} · {p.gender ?? "—"} · MRN: {p.mrn}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
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
