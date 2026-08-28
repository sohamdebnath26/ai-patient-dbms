import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { getSupabaseClient } from "@infrastructure/supabase/client";
import { formatDate } from "@presentation/components/patient/utils";
import { Stethoscope, ChevronRight, Loader2 } from "lucide-react";

interface EncounterListItem {
  id: string;
  status: string;
  chief_complaint: string | null;
  encounter_date: string;
  encounter_number: string | null;
  patient: { first_name: string; last_name: string }[] | null;
}

function useRecentEncounters(auth: AuthorizationContext) {
  const scope = resolveAuthScope(auth);
  return useQuery({
    queryKey: ["encounters", "recent", scope.column, scope.value],
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data } = (await client
        .from("encounters")
        .select(
          "id,status,chief_complaint,encounter_date,encounter_number,patient:patients(first_name,last_name)",
        )
        .eq(scope.column, scope.value)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(50)) as unknown as {
        data: EncounterListItem[] | null;
      };
      return data ?? [];
    },
  });
}

export function EncounterListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  const auth: AuthorizationContext = {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
  const { data: encounters, isLoading } = useRecentEncounters(auth);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Encounters</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && (encounters?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="bg-surface-50 flex h-16 w-16 items-center justify-center rounded-full">
              <Stethoscope className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">No encounters yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Encounters appear here once you start a consultation from an appointment.
            </p>
          </div>
        )}

        {!isLoading && (encounters?.length ?? 0) > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Patient</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Encounter</th>
                  <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell">Date</th>
                  <th className="hidden px-4 py-3 font-medium text-gray-600 lg:table-cell">
                    Chief Complaint
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {encounters?.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => {
                      void navigate(`/encounters/${e.id}`);
                    }}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {e.patient?.[0]?.first_name ?? "—"} {e.patient?.[0]?.last_name ?? ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.encounter_number ?? "Encounter"}</td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      {formatDate(e.encounter_date)}
                    </td>
                    <td className="hidden max-w-xs truncate px-4 py-3 text-gray-600 lg:table-cell">
                      {e.chief_complaint || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          e.status === "in_progress"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {e.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
