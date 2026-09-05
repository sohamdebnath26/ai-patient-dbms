import { useNavigate } from "react-router";
import { useState } from "react";
import { AppShell } from "@presentation/components/AppShell";
import { useRecentEncounters } from "@presentation/hooks/useEncounters";
import { formatDate } from "@presentation/components/patient/utils";
import { Stethoscope, ChevronRight, Loader2, AlertCircle, Plus } from "lucide-react";

export function EncounterListPage() {
  const navigate = useNavigate();
  const { data: encounters, isLoading, isError, error } = useRecentEncounters();
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Encounters</h1>
          <div className="relative">
            <button
              onClick={() => {
                setNewMenuOpen((v) => !v);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              New Encounter
            </button>
            {newMenuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setNewMenuOpen(false);
                    void navigate("/patients/new?redirectToEncounter=true");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 text-green-600" />
                  Register Patient First
                </button>
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-medium text-red-600">Failed to load encounters</p>
            <p className="mt-1 text-sm text-gray-500">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (encounters?.length ?? 0) === 0 && (
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

        {!isLoading && !isError && (encounters?.length ?? 0) > 0 && (
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
                      {e.patient ? `${e.patient.first_name} ${e.patient.last_name}` : "—"}
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
