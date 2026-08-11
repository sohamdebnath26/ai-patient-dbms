import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAppointmentSchema, type CreateAppointmentInput } from "@domain/appointment";
import { useBookAppointment } from "@presentation/hooks/useAppointments";
import { usePatientList } from "@presentation/hooks/usePatients";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

export function AppointmentCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const mutation = useBookAppointment();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: patients } = usePatientList({ page: 1, limit: 50, query: searchQuery });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: {
      organization_id: profile?.organizationId ?? "",
      duration_minutes: 30,
      type: "in_person",
    },
  });

  function onSubmit(data: CreateAppointmentInput) {
    if (!user) return;
    mutation.mutate(
      { input: data, userId: user.id },
      {
        onSuccess: () => {
          void navigate("/appointments");
        },
      },
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => {
            void navigate("/appointments");
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="space-y-6"
        >
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Search Patient *</label>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Type to search..."
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {patients && patients.patients.length > 0 && (
                <div className="mt-1 max-h-40 overflow-auto rounded-md border border-gray-200">
                  {patients.patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setValue("patient_id", p.id);
                        setSearchQuery(`${p.first_name} ${p.last_name} (${p.mrn})`);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {p.first_name} {p.last_name} <span className="text-gray-400">({p.mrn})</span>
                    </button>
                  ))}
                </div>
              )}
              <input type="hidden" {...register("patient_id")} />
              {errors.patient_id && (
                <p className="mt-1 text-xs text-red-600">{errors.patient_id.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  {...register("appointment_date")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.appointment_date && (
                  <p className="mt-1 text-xs text-red-600">{errors.appointment_date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  {...register("appointment_time")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                <input
                  type="number"
                  {...register("duration_minutes")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  {...register("type")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="in_person">In Person</option>
                  <option value="telehealth">Telehealth</option>
                  <option value="home_visit">Home Visit</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  {...register("reason")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization *</label>
                <input
                  {...register("organization_id")}
                  placeholder="UUID"
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.organization_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.organization_id.message}</p>
                )}
              </div>
            </div>
          </div>

          {mutation.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {mutation.error.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Book Appointment
            </button>
            <button
              type="button"
              onClick={() => {
                void navigate("/appointments");
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
