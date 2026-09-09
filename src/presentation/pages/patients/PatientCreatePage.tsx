import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useCreateQuickPatient } from "@presentation/hooks/usePatients";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

const QuickPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(7, "Phone is required"),
});

type QuickPatientInput = z.infer<typeof QuickPatientSchema>;

export function PatientCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateQuickPatient();
  const toast = useToast();
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickPatientInput>({
    resolver: zodResolver(QuickPatientSchema),
  });

  function onSubmit(data: QuickPatientInput) {
    setActionError(null);
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
          void navigate(`/patients/${patient.id}`);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Failed to register patient");
        },
      },
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <button
          onClick={() => {
            void navigate("/patients");
          }}
          className="inline-flex items-center gap-1 text-base text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-xl">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Patient</h1>
            <p className="text-sm text-gray-500">
              Register a new patient. Full clinical details can be added from the patient record.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("first_name")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("last_name")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("dob")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                {...register("gender")}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register("phone")}
                placeholder="e.g. +91 98765 43210"
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
          </div>

          {actionError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>
          )}

          {createMutation.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {createMutation.error.message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register Patient
            </button>
            <button
              type="button"
              onClick={() => {
                void navigate("/patients");
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
