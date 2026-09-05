import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateAppointmentSchema } from "@domain/appointment";
import { useBookAppointment } from "@presentation/hooks/useAppointments";
import { usePatientList, useCreateQuickPatient } from "@presentation/hooks/usePatients";
import { useAuth } from "@presentation/hooks/useAuth";
import { AppShell } from "@presentation/components/AppShell";
import { ArrowLeft, Loader2, Search, User, UserPlus, Calendar, Clock } from "lucide-react";
import { useState } from "react";

const AppointmentFormSchema = CreateAppointmentSchema.omit({ patient_id: true });

type AppointmentFormInput = z.infer<typeof AppointmentFormSchema>;

const QuickPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(7, "Phone is required"),
});

type QuickPatientInput = z.infer<typeof QuickPatientSchema>;

type PatientMode = "existing" | "new";

export function AppointmentCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const bookMutation = useBookAppointment();
  const createPatientMutation = useCreateQuickPatient();
  const [patientMode, setPatientMode] = useState<PatientMode>("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientLabel, setSelectedPatientLabel] = useState("");
  const { data: patients } = usePatientList({ page: 1, limit: 50, query: searchQuery });
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      duration_minutes: 30,
      type: "in_person",
    },
  });

  function handleExistingSubmit(data: AppointmentFormInput) {
    if (!user || !selectedPatientId) return;
    setActionError(null);
    bookMutation.mutate(
      { input: { ...data, patient_id: selectedPatientId }, userId: user.id },
      {
        onSuccess: (appt) => {
          void navigate(`/appointments/${appt.id}?new=true`);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Booking failed");
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
          Back to Appointments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>

        {/* Patient Mode Tabs */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => {
              setPatientMode("existing");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              patientMode === "existing"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="h-4 w-4" />
            Existing Patient
          </button>
          <button
            onClick={() => {
              setPatientMode("new");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              patientMode === "new"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            New Patient
          </button>
        </div>

        {patientMode === "existing" && (
          <form
            onSubmit={(e) => {
              void handleSubmit(handleExistingSubmit)(e);
            }}
            className="space-y-6"
          >
            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <Search className="mr-1 inline h-4 w-4" />
                  Search Patient *
                </label>
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search by name, MRN, or phone..."
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {patients && patients.patients.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-auto rounded-md border border-gray-200">
                    {patients.patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setSelectedPatientLabel(`${p.first_name} ${p.last_name} (${p.mrn})`);
                          setSearchQuery(`${p.first_name} ${p.last_name} (${p.mrn})`);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          selectedPatientId === p.id ? "bg-brand-50" : ""
                        }`}
                      >
                        <span className="font-medium">
                          {p.first_name} {p.last_name}
                        </span>{" "}
                        <span className="text-gray-400">
                          MRN: {p.mrn} · {p.gender || "—"} · {p.dob || "—"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatientLabel && (
                  <p className="text-brand-600 mt-1 text-xs">Selected: {selectedPatientLabel}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="mr-1 inline h-4 w-4" />
                    Date *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    <Clock className="mr-1 inline h-4 w-4" />
                    Time
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for Visit
                  </label>
                  <input
                    {...register("reason")}
                    placeholder="e.g. Skin consultation, follow-up"
                    className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {actionError && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
              </div>
            )}

            {bookMutation.isError && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {bookMutation.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!selectedPatientId || bookMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Create
                Appointment
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
        )}

        {patientMode === "new" && (
          <NewPatientFlow
            createPatientMutation={createPatientMutation}
            bookMutation={bookMutation}
            navigate={navigate}
          />
        )}
      </div>
    </AppShell>
  );
}

// --- New Patient Flow (extracted for cleaniness) ---

function NewPatientFlow({
  createPatientMutation,
  bookMutation,
  navigate,
}: {
  createPatientMutation: ReturnType<typeof useCreateQuickPatient>;
  bookMutation: ReturnType<typeof useBookAppointment>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [step, setStep] = useState<"patient" | "appointment" | "done">("patient");
  const [createdPatientId, setCreatedPatientId] = useState<string>("");

  const {
    register: registerPatient,
    handleSubmit: handlePatientSubmit,
    formState: { errors: patientErrors },
  } = useForm<QuickPatientInput>({
    resolver: zodResolver(QuickPatientSchema),
  });

  const {
    register: registerAppt,
    handleSubmit: handleApptSubmit,
    formState: { errors: apptErrors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      duration_minutes: 30,
      type: "in_person",
    },
  });

  function handleCreatePatient(data: QuickPatientInput) {
    setActionError(null);
    const mrn = `MRN-${Date.now()}`;
    createPatientMutation.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        mrn,
        status: "active",
        address_line1: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        primary_diagnosis: "",
        current_treatment: "",
        chief_complaint: "",
        present_illness: "",
        date_of_onset: "",
        symptoms: "",
      },
      {
        onSuccess: (patient) => {
          setCreatedPatientId(patient.id);
          setStep("appointment");
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Failed to register patient");
        },
      },
    );
  }

  function handleBookAppointment(data: AppointmentFormInput) {
    if (!user || !createdPatientId) return;
    setActionError(null);
    bookMutation.mutate(
      { input: { ...data, patient_id: createdPatientId }, userId: user.id },
      {
        onSuccess: (appt) => {
          void navigate(`/appointments/${appt.id}?new=true`);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Booking failed");
        },
      },
    );
  }

  if (step === "patient") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handlePatientSubmit(handleCreatePatient)(e);
        }}
        className="space-y-6"
      >
        <div className="space-y-4 rounded-lg border border-green-200 bg-white p-6">
          <div className="mb-2 text-sm font-semibold text-green-700">
            Step 1 of 2: Patient Information
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                {...registerPatient("first_name")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {patientErrors.first_name && (
                <p className="mt-1 text-xs text-red-600">{patientErrors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                {...registerPatient("last_name")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {patientErrors.last_name && (
                <p className="mt-1 text-xs text-red-600">{patientErrors.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                type="date"
                {...registerPatient("dob")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {patientErrors.dob && (
                <p className="mt-1 text-xs text-red-600">{patientErrors.dob.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                {...registerPatient("gender")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {patientErrors.gender && (
                <p className="mt-1 text-xs text-red-600">{patientErrors.gender.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                {...registerPatient("phone")}
                placeholder="e.g. +91 98765 43210"
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {patientErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{patientErrors.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {actionError && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createPatientMutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {createPatientMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue to Appointment
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
    );
  }

  if (step === "appointment") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleApptSubmit(handleBookAppointment)(e);
        }}
        className="space-y-6"
      >
        <div className="space-y-4 rounded-lg border border-green-200 bg-white p-6">
          <div className="mb-2 text-sm font-semibold text-green-700">
            Step 2 of 2: Appointment Details
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="mr-1 inline h-4 w-4" />
                Date *
              </label>
              <input
                type="date"
                {...registerAppt("appointment_date")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {apptErrors.appointment_date && (
                <p className="mt-1 text-xs text-red-600">{apptErrors.appointment_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <Clock className="mr-1 inline h-4 w-4" />
                Time
              </label>
              <input
                type="time"
                {...registerAppt("appointment_time")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
              <input
                type="number"
                {...registerAppt("duration_minutes")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                {...registerAppt("type")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              >
                <option value="in_person">In Person</option>
                <option value="telehealth">Telehealth</option>
                <option value="home_visit">Home Visit</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
              <input
                {...registerAppt("reason")}
                placeholder="e.g. Skin consultation, follow-up"
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {actionError && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>
        )}

        {bookMutation.isError && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {bookMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={bookMutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Appointment
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("patient");
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  return null;
}
