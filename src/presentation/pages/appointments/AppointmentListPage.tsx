import { useNavigate, useSearchParams } from "react-router";
import { useAppointmentList } from "@presentation/hooks/useAppointments";
import { AppShell } from "@presentation/components/AppShell";
import { Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  confirmed: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-green-50 text-green-700",
  completed: "bg-gray-50 text-gray-700",
  cancelled: "bg-red-50 text-red-600",
  no_show: "bg-red-100 text-red-800",
};

export function AppointmentListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const page = parseInt(params.get("page") ?? "1", 10);
  const status =
    (params.get("status") as
      | "scheduled"
      | "confirmed"
      | "in_progress"
      | "completed"
      | "cancelled"
      | "no_show"
      | undefined) ?? undefined;
  const dateFrom = params.get("dateFrom") ?? undefined;
  const dateTo = params.get("dateTo") ?? undefined;

  const { data, isLoading, isError, error } = useAppointmentList({
    page,
    limit: 20,
    status,
    dateFrom,
    dateTo,
    hideCancelled: !status,
  });

  function update(upd: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(upd).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!upd.page) next.delete("page");
    setParams(next);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <button
            onClick={() => {
              void navigate("/appointments/new");
            }}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Book Appointment
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => {
                update({ dateFrom: e.target.value });
              }}
              className="focus:border-brand-500 focus:ring-brand-500 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => {
                update({ dateTo: e.target.value });
              }}
              className="focus:border-brand-500 focus:ring-brand-500 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              placeholder="To"
            />
          </div>
          <select
            value={status ?? ""}
            onChange={(e) => {
              update({ status: e.target.value });
            }}
            className="focus:border-brand-500 focus:ring-brand-500 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
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
            <p className="mt-2 text-sm font-medium text-red-600">Failed to load appointments</p>
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
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Time</th>
                    <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell">
                      Patient
                    </th>
                    <th className="hidden px-4 py-3 font-medium text-gray-600 lg:table-cell">
                      Type
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.appointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No appointments found.
                      </td>
                    </tr>
                  )}
                  {data.appointments.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => {
                        void navigate(`/appointments/${a.id}`);
                      }}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{a.appointment_date}</td>
                      <td className="px-4 py-3 text-gray-600">{a.appointment_time ?? "—"}</td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 capitalize lg:table-cell">
                        {a.type.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] ?? "bg-gray-50 text-gray-700"}`}
                        >
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">
                {data.total} appointments · Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    update({ page: String(page - 1) });
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => {
                    update({ page: String(page + 1) });
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
