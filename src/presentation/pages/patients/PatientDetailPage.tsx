import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  usePatient,
  useArchivePatient,
  useDeregisterPatient,
} from "@presentation/hooks/usePatients";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import {
  ArrowLeft,
  Pencil,
  Archive,
  UserRoundX,
  Loader2,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Clock,
} from "lucide-react";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const archiveMutation = useArchivePatient();
  const deregisterMutation = useDeregisterPatient();
  const [deregisterOpen, setDeregisterOpen] = useState(false);

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => void navigate("/patients")}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => void navigate(`/patients/${patient.id}/edit`)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
            {patient.status !== "archived" &&
              patient.status !== "deregistered" &&
              profile?.role === "doctor" && (
                <>
                  <button
                    onClick={() => {
                      setDeregisterOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-orange-200 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <UserRoundX className="h-4 w-4" />
                    Deregister
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Archive this patient?")) {
                        archiveMutation.mutate(patient.id);
                        void navigate("/patients");
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </>
              )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="bg-brand-50 flex h-16 w-16 items-center justify-center rounded-full">
              <span className="text-brand-600 text-2xl font-semibold">
                {patient.first_name.charAt(0)}
                {patient.last_name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h1>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    patient.status === "active"
                      ? "bg-green-50 text-green-700"
                      : patient.status === "deregistered"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {patient.status}
                </span>
              </div>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  MRN: <span className="font-mono font-medium text-gray-900">{patient.mrn}</span>
                </div>
                {patient.dob && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    DOB: {patient.dob} {patient.gender ? `· ${patient.gender}` : ""}
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {patient.phone}
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {patient.email}
                  </div>
                )}
                {patient.blood_group && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Heart className="h-4 w-4 text-gray-400" />
                    Blood: {patient.blood_group}
                  </div>
                )}
                {patient.marital_status && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    {patient.marital_status}
                  </div>
                )}
              </div>
              {patient.address && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {patient.address}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">Demographics</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {patient.occupation && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Occupation</dt>
                  <dd className="text-gray-900">{patient.occupation}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(patient.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">
                  {new Date(patient.updated_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-gray-400" />
              Timeline
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Appointments, consultations, and clinical notes will appear here.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deregisterOpen}
        title="Deregister Patient"
        message="Are you sure you want to deregister this patient?"
        confirmLabel="Deregister"
        confirmationText="DEREGISTER"
        loading={deregisterMutation.isPending}
        onCancel={() => {
          setDeregisterOpen(false);
        }}
        onConfirm={() => {
          deregisterMutation.mutate(patient.id, {
            onSuccess: () => {
              setDeregisterOpen(false);
              void navigate("/patients");
            },
          });
        }}
      />
    </AppShell>
  );
}
