import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePatientFormSchema, type CreatePatientFormInput } from "@domain/patient";
import { useCreatePatient } from "@presentation/hooks/usePatients";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { AppShell } from "@presentation/components/AppShell";
import { ArrowLeft, Loader2, UserRound, Building2 } from "lucide-react";

export function PatientCreatePage() {
  const navigate = useNavigate();
  const { phase, hasOrganization, selectedOrganizationId } = useResolvedOrganization();
  const createMutation = useCreatePatient();

  const canSubmit = phase === "ready" && !createMutation.isPending;

  const defaultMrn = useMemo(() => `MRN-${Date.now()}`, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePatientFormInput>({
    resolver: zodResolver(CreatePatientFormSchema),
    defaultValues: {
      mrn: defaultMrn,
    },
  });

  function onSubmit(data: CreatePatientFormInput) {
    createMutation.mutate(data, {
      onSuccess: (patient) => {
        void navigate(`/patients/${patient.id}`);
      },
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => void navigate("/patients")}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Register Patient</h1>
          <ScopeBadge hasOrganization={hasOrganization} orgId={selectedOrganizationId} />
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">Personal Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  {...register("first_name")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  {...register("last_name")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  {...register("dob")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select
                  {...register("gender")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">Contact & Medical Record</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register("email")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register("phone")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  {...register("address")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <select
                  {...register("blood_group")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">MRN *</label>
                <input
                  {...register("mrn")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.mrn && <p className="mt-1 text-xs text-red-600">{errors.mrn.message}</p>}
              </div>
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {createMutation.error.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Register Patient
            </button>
            <button
              type="button"
              onClick={() => void navigate("/patients")}
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

function ScopeBadge({
  hasOrganization,
  orgId,
}: {
  hasOrganization: boolean;
  orgId: string | null;
}) {
  if (hasOrganization) {
    return (
      <span className="bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
        <Building2 className="h-3.5 w-3.5" />
        Organization record
      </span>
    );
  }
  return (
    <span
      className="bg-surface-100 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-gray-700"
      title={orgId === null ? "Saved with created_by = auth.uid() only" : "Pending selection"}
    >
      <UserRound className="h-3.5 w-3.5" />
      Personal record
    </span>
  );
}
