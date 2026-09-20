import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useCreateQuickPatient } from "@presentation/hooks/usePatients";
import { useBookAppointment } from "@presentation/hooks/useAppointments";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import { ArrowLeft, Loader2, UserPlus, Calendar, Check } from "lucide-react";
import { useState } from "react";
import type { Patient } from "@domain/patient";
import { getSupabaseClient } from "@infrastructure/supabase/client";

const QuickPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(7, "Phone is required"),
});

type QuickPatientInput = z.infer<typeof QuickPatientSchema>;

type AppointmentInput = {
  appointment_date: string;
  appointment_time?: string;
  reason?: string;
};

export function PatientCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateQuickPatient();
  const bookMutation = useBookAppointment();
  const toast = useToast();
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickPatientInput>({
    resolver: zodResolver(QuickPatientSchema),
  });

  const {
    register: registerApt,
    handleSubmit: handleSubmitApt,
    formState: { errors: aptErrors },
  } = useForm<AppointmentInput>();

  async function onSubmit(data: QuickPatientInput) {
    setActionError(null);
    setCheckingDuplicate(true);

    try {
      const client = getSupabaseClient();
      const { data: existing } = (await client
        .from("patients")
        .select("id,first_name,last_name")
        .eq("first_name", data.first_name.trim())
        .eq("last_name", data.last_name.trim())
        .eq("dob", data.dob)
        .eq("phone", data.phone.trim())
        .neq("status", "deregistered")
        .limit(1)) as unknown as {
        data: { id: string }[] | null;
        error: { message: string } | null;
      };

      if (existing && existing.length > 0) {
        setActionError(
          "Patient already exists. Kindly go to the Patients tab and click on the patient name to start a consultation.",
        );
        setCheckingDuplicate(false);
        return;
      }
    } catch {
      setActionError("Unable to verify patient. Please try again.");
      setCheckingDuplicate(false);
      return;
    }

    setCheckingDuplicate(false);
    const mrn = `MRN-${Date.now()}`;
    createMutation.mutate(
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
          toast.success("Patient registered successfully.");
          setCreatedPatient(patient);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Failed to register patient");
        },
      },
    );
  }

  function onSchedule(data: AppointmentInput) {
    if (!createdPatient) return;
    const today = new Date().toISOString().slice(0, 10);
    bookMutation.mutate(
      {
        input: {
          patient_id: createdPatient.id,
          appointment_date: data.appointment_date || today,
          appointment_time: data.appointment_time ?? null,
          duration_minutes: 30,
          type: "in_person",
          reason: data.reason ?? "Consultation",
        },
        userId: createdPatient.created_by,
      },
      {
        onSuccess: () => {
          toast.success("Appointment scheduled successfully.");
          void navigate(`/patients/${createdPatient.id}`);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Failed to schedule appointment");
        },
      },
    );
  }

  if (createdPatient) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg space-y-6">
          <button
            onClick={() => {
              void navigate(`/patients/${createdPatient.id}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Skip &amp; go to patient
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Patient Registered</h1>
              <p className="text-sm font-medium text-gray-500">
                {createdPatient.first_name} {createdPatient.last_name} has been registered
                successfully.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Schedule Consultation</h2>
            </div>

            <form
              onSubmit={(e) => {
                void handleSubmitApt(onSchedule)(e);
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerApt("appointment_date")}
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                  />
                  {aptErrors.appointment_date && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      {aptErrors.appointment_date.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Time</label>
                  <input
                    type="time"
                    {...registerApt("appointment_time")}
                    className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Reason</label>
                <input
                  type="text"
                  {...registerApt("reason")}
                  placeholder="e.g. Skin consultation, Follow-up"
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                />
              </div>

              {actionError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {actionError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg disabled:opacity-50"
                >
                  {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Schedule Appointment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void navigate(`/patients/${createdPatient.id}`);
                  }}
                  className="rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <button
          onClick={() => {
            void navigate("/patients");
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg shadow-slate-200">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Add Patient</h1>
            <p className="text-sm font-medium text-gray-400">
              Register a new patient. Full clinical details can be added from the patient record.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register("first_name")}
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors placeholder:text-gray-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 focus:outline-none"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs font-medium text-rose-500">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register("last_name")}
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors placeholder:text-gray-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 focus:outline-none"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs font-medium text-rose-500">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("dob")}
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 focus:outline-none"
                />
                {errors.dob && (
                  <p className="mt-1 text-xs font-medium text-rose-500">{errors.dob.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("gender")}
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs font-medium text-rose-500">{errors.gender.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors placeholder:text-gray-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 focus:outline-none"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs font-medium text-rose-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {actionError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {actionError}
              </div>
            )}

            {createMutation.isError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {createMutation.error.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || checkingDuplicate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-200 transition-all hover:from-slate-800 hover:to-slate-900 hover:shadow-lg disabled:opacity-50"
              >
                {(createMutation.isPending || checkingDuplicate) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Register Patient
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigate("/patients");
                }}
                className="rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
