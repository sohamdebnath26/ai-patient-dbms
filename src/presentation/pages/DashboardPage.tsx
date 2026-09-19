import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { Users, ChevronRight, ArrowRight, AlertTriangle, Plus } from "lucide-react";
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
  const recentPatients = useRecentPatients(auth);

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
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
