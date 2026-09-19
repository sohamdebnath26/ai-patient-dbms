import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge } from "@presentation/components/patient/utils";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  );
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="py-12 text-center text-gray-500">Patient not found.</div>
      </AppShell>
    );
  }

  const canEdit = profile?.role === "doctor" || profile?.role === "receptionist";
  const patientName = `${patient.first_name} ${patient.last_name}`.trim();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => void navigate("/patients")}
            className="inline-flex items-center gap-1 text-base text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
          {canEdit && (
            <button
              onClick={() => {
                void navigate(`/patients/${patient.id}/edit`);
              }}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" /> Start Consultation
            </button>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">{patientName}</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Age"
              value={computeAge(patient.dob) !== null ? `${computeAge(patient.dob)} yrs` : null}
            />
            <Field label="Gender" value={patient.gender} />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Contact Details</h3>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Phone" value={patient.phone} />
              <Field label="Email" value={patient.email} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Name" value={patient.emergency_contact_name} />
              <Field label="Phone" value={patient.emergency_contact_phone} />
              <Field label="Relationship" value={patient.emergency_contact_relationship} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
