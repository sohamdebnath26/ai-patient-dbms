import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  usePatient,
  useArchivePatient,
  useDeregisterPatient,
} from "@presentation/hooks/usePatients";
import { useCreateEncounter, usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import { formatDate, computeAge } from "@presentation/components/patient/utils";
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
  Heart,
  Stethoscope,
  Pill,
  AlertTriangle,
  Clock,
} from "lucide-react";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const archiveMutation = useArchivePatient();
  const deregisterMutation = useDeregisterPatient();
  const createEncounter = useCreateEncounter();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");
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
  const age = computeAge(patient.dob);

  const latestEncounter =
    (encounters ?? []).find((e) => e.status === "completed") ?? (encounters ?? [])[0] ?? null;
  const nextFollowUp = latestEncounter?.follow_up_date ?? null;

  const handleNewEncounter = () => {
    createEncounter.mutate(patient.id, {
      onSuccess: (encounter) => void navigate(`/encounters/${encounter.id}`),
    });
  };

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
            {profile?.role === "doctor" &&
              patient.status !== "archived" &&
              patient.status !== "deregistered" && (
                <button
                  onClick={handleNewEncounter}
                  disabled={createEncounter.isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {createEncounter.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                  New Encounter
                </button>
              )}
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
                    DOB: {patient.dob} {age !== null ? `· ${age} yrs` : ""} · {patient.gender ?? ""}
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
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Stethoscope className="h-4 w-4 text-gray-400" />
              Latest Clinical Summary
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Latest Diagnosis" value={patient.primary_diagnosis ?? "—"} />
              <SummaryRow label="Latest Treatment" value={patient.current_treatment ?? "—"} />
              <SummaryRow
                label="Last Visit"
                value={formatDate(latestEncounter?.encounter_date ?? null)}
              />
              <SummaryRow label="Next Follow-up" value={formatDate(nextFollowUp)} />
              <SummaryRow label="Total Encounters" value={String(encounters?.length ?? 0)} />
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-gray-400" />
              Encounter History
            </h2>
            {encounters && encounters.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {encounters.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => void navigate(`/encounters/${e.id}`)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <span className="text-gray-700">
                        {e.encounter_number ?? "Encounter"} · {formatDate(e.encounter_date)}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {e.status.replace("_", " ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-400">No encounters recorded yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              Medical Alerts
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(clinical?.alerts ?? []).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                >
                  {a.label}
                </span>
              ))}
              {(clinical?.alerts ?? []).length === 0 && (
                <p className="text-sm text-gray-400">No known alerts.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Pill className="h-4 w-4 text-gray-400" />
              Current Medications
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {(clinical?.medications ?? []).map((m) => (
                <li key={m.id} className="text-gray-700">
                  {m.medication_name} {m.dosage ? `— ${m.dosage}` : ""}
                  {m.frequency ? `, ${m.frequency}` : ""}
                </li>
              ))}
              {(clinical?.medications ?? []).length === 0 && (
                <li className="text-gray-400">No active medications.</li>
              )}
            </ul>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-gray-900">{value}</dd>
    </div>
  );
}
