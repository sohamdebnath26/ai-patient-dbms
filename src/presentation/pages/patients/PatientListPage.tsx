import { useNavigate, useSearchParams } from "react-router";
import { usePatientList } from "@presentation/hooks/usePatients";
import { AppShell } from "@presentation/components/AppShell";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserPlus,
  Users,
} from "lucide-react";

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

  const statusStyle = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-800 border-emerald-200",
      inactive: "bg-amber-100 text-amber-800 border-amber-200",
      deceased: "bg-slate-100 text-slate-600 border-slate-200",
      deregistered: "bg-rose-100 text-rose-700 border-rose-200",
      archived: "bg-violet-100 text-violet-700 border-violet-200",
    };
    return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[s] ?? "bg-gray-100 text-gray-600 border-gray-200"}`;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-blue-700 p-6 shadow-lg shadow-indigo-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Patients</h1>
                <p className="text-sm text-indigo-200">
                  {data ? `${data.total} registered` : "Loading..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => void navigate("/patients/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              Add Patient
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm transition-colors placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </form>
          </div>
          <select
            value={status ?? ""}
            onChange={(e) => {
              updateParams({ status: e.target.value });
            }}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
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
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-white py-16 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <p className="mt-4 text-sm font-semibold text-red-700">Failed to load patients</p>
            <p className="mt-1 text-sm text-gray-400">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="mt-5 rounded-xl border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                    <th className="px-5 py-3.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      MRN
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="hidden px-5 py-3.5 text-xs font-bold tracking-wider text-gray-400 uppercase md:table-cell">
                      DOB
                    </th>
                    <th className="hidden px-5 py-3.5 text-xs font-bold tracking-wider text-gray-400 uppercase md:table-cell">
                      Gender
                    </th>
                    <th className="hidden px-5 py-3.5 text-xs font-bold tracking-wider text-gray-400 uppercase lg:table-cell">
                      Phone
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.patients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <Users className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="mt-3 text-sm font-medium text-gray-500">
                            No patients found
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.patients.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => void navigate(`/patients/${p.id}`)}
                      className="cursor-pointer transition-colors hover:bg-indigo-50/50"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-semibold text-gray-600">
                          {p.mrn}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-200">
                            <span className="text-xs font-bold text-indigo-700">
                              {p.first_name.charAt(0)}
                              {p.last_name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {p.first_name} {p.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 font-medium text-gray-600 md:table-cell">
                        {p.dob ?? "\u2014"}
                      </td>
                      <td className="hidden px-5 py-4 font-medium text-gray-600 md:table-cell">
                        {p.gender ?? "\u2014"}
                      </td>
                      <td className="hidden px-5 py-4 font-medium text-gray-600 lg:table-cell">
                        {p.phone ?? "\u2014"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusStyle(p.status)}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">
                {data.total} patients &middot; Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    updateParams({ page: String(page - 1) });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => {
                    updateParams({ page: String(page + 1) });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-30"
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
