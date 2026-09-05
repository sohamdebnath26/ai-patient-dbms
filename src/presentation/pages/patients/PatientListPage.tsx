import { useNavigate, useSearchParams } from "react-router";
import { usePatientList } from "@presentation/hooks/usePatients";
import { AppShell } from "@presentation/components/AppShell";
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

export function PatientListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const query = searchParams.get("query") ?? "";
  const status =
    (searchParams.get("status") as
      "active" | "inactive" | "deceased" | "archived" | "deregistered" | undefined) ?? undefined;

  const { data, isLoading, isError, error } = usePatientList({
    page,
    limit: 20,
    query: query || undefined,
    status,
  });

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (updates.page) next.delete("page");
    setSearchParams(next);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <button
            onClick={() => void navigate("/appointments/new")}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white"
          >
            New Appointment
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateParams({ query: formData.get("q") as string });
              }}
            >
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by name, MRN, phone..."
                className="focus:border-brand-500 focus:ring-brand-500 w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
              />
            </form>
          </div>
          <select
            value={status ?? ""}
            onChange={(e) => {
              updateParams({ status: e.target.value });
            }}
            className="focus:border-brand-500 focus:ring-brand-500 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deceased">Deceased</option>
            <option value="archived">Archived</option>
            <option value="deregistered">Deregistered</option>
          </select>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-medium text-red-600">Failed to load patients</p>
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

        {data && (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">MRN</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell">
                      DOB
                    </th>
                    <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell">
                      Gender
                    </th>
                    <th className="hidden px-4 py-3 font-medium text-gray-600 lg:table-cell">
                      Phone
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.patients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No patients found.
                      </td>
                    </tr>
                  )}
                  {data.patients.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => void navigate(`/patients/${p.id}`)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.mrn}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                        {p.dob ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                        {p.gender ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                        {p.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "active"
                              ? "bg-green-50 text-green-700"
                              : p.status === "inactive"
                                ? "bg-yellow-50 text-yellow-700"
                                : p.status === "deceased"
                                  ? "bg-gray-100 text-gray-600"
                                  : p.status === "deregistered"
                                    ? "bg-orange-50 text-orange-600"
                                    : "bg-red-50 text-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">
                {data.total} patients · Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    updateParams({ page: String(page - 1) });
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => {
                    updateParams({ page: String(page + 1) });
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
