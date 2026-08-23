import { useNavigate, useParams } from "react-router";
import {
  useAppointment,
  useCheckInAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
} from "@presentation/hooks/useAppointments";
import { useEncounterByAppointment, useStartEncounter } from "@presentation/hooks/useEncounters";
import { useProfile } from "@presentation/hooks/useProfile";
import { useAuth } from "@presentation/hooks/useAuth";
import { AppShell } from "@presentation/components/AppShell";
import { useState } from "react";
import { ArrowLeft, Loader2, User, FileText, Play, XCircle, Calendar } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  confirmed: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-green-50 text-green-700",
  completed: "bg-gray-50 text-gray-700",
  cancelled: "bg-red-50 text-red-600",
  no_show: "bg-red-100 text-red-800",
};

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: appt, isLoading } = useAppointment(id ?? "");
  const { data: encounter } = useEncounterByAppointment(id ?? "");
  const checkIn = useCheckInAppointment();
  const cancel = useCancelAppointment();
  const startEncounter = useStartEncounter();
  const reschedule = useRescheduleAppointment();
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading)
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  if (!appt)
    return (
      <AppShell>
        <div className="py-12 text-center text-gray-500">Appointment not found.</div>
      </AppShell>
    );

  const isDoctor = profile?.role === "doctor";

  async function handleCheckIn() {
    if (!user || !id) return;
    setActionError(null);
    try {
      await checkIn.mutateAsync({ id, userId: user.id });
      await startEncounter.mutateAsync({ appointmentId: id, userId: user.id });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  }

  async function handleCancel() {
    if (!user || !id) return;
    setActionError(null);
    try {
      await cancel.mutateAsync({ id, userId: user.id });
      void navigate("/appointments");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  }

  async function handleReschedule() {
    if (!id || !newDate) return;
    setActionError(null);
    try {
      await reschedule.mutateAsync({ id, date: newDate, time: newTime });
      setShowReschedule(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <button
          onClick={() => {
            void navigate("/appointments");
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </button>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {appt.patient
                    ? `${appt.patient.first_name} ${appt.patient.last_name}`
                    : "Appointment"}
                </h1>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appt.status] ?? ""}`}
                >
                  {appt.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {appt.appointment_date} at {appt.appointment_time ?? "—"} ·{" "}
                  {appt.duration_minutes} min
                </div>
                {appt.patient && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    MRN: {appt.patient.mrn}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {appt.type.replace("_", " ")}
                </div>
                {appt.reason && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {appt.reason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isDoctor && appt.status === "scheduled" && (
                <button
                  onClick={() => {
                    void handleCheckIn();
                  }}
                  disabled={checkIn.isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Check-in & Start Encounter
                </button>
              )}
              {appt.status !== "cancelled" &&
                appt.status !== "completed" &&
                appt.status !== "no_show" && (
                  <>
                    <button
                      onClick={() => {
                        setShowReschedule(!showReschedule);
                        setNewDate(appt.appointment_date);
                        setNewTime(appt.appointment_time ?? "");
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Calendar className="h-4 w-4" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => {
                        void handleCancel();
                      }}
                      disabled={cancel.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </button>
                  </>
                )}
            </div>
          </div>

          {actionError && (
            <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {actionError}
            </div>
          )}

          {showReschedule && (
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md bg-gray-50 p-4">
              <div>
                <label className="block text-xs font-medium text-gray-600">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                  }}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">New Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => {
                    setNewTime(e.target.value);
                  }}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                onClick={() => {
                  void handleReschedule();
                }}
                disabled={reschedule.isPending}
                className="bg-brand-600 hover:bg-brand-700 rounded-md px-3 py-1.5 text-sm font-medium text-white"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {encounter && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">Encounter</h2>
            <p className="mt-2 text-sm text-gray-600">
              Status: <span className="font-medium">{encounter.status.replace("_", " ")}</span>
            </p>
            <button
              onClick={() => {
                void navigate(`/encounters/${encounter.id}`);
              }}
              className="text-brand-600 hover:text-brand-500 mt-2 text-sm font-medium"
            >
              View Encounter →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
