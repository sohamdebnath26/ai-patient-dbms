import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { ClinicalService } from "@application/clinical/ClinicalService";
import { SupabaseClinicalRepository } from "@infrastructure/supabase/clinical/SupabaseClinicalRepository";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge } from "@presentation/components/patient/utils";
import { SectionHeading } from "@presentation/components/patient/helpers";
import type { Encounter } from "@domain/encounter";
import type { MedicalAlert } from "@domain/patient";
import { ArrowLeft, Pencil, Loader2, Stethoscope, Pill, AlertTriangle } from "lucide-react";

const clinicalRepo = new SupabaseClinicalRepository();
const clinicalService = new ClinicalService(clinicalRepo);

function formatDateSafe(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const ReadOnlyField = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  );
};

function EncounterMedicationTable({ encounterId }: { encounterId: string }) {
  const { data: meds, isLoading } = useQuery({
    queryKey: ["encounters", encounterId, "medications"],
    queryFn: () => clinicalService.listMedicationsByEncounter(encounterId),
    enabled: !!encounterId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading medications...</span>
      </div>
    );
  }

  if (!meds || meds.length === 0) {
    return (
      <p className="text-sm text-gray-400">No medications prescribed during this consultation.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
            <th className="pr-3 pb-2">Medication</th>
            <th className="pr-3 pb-2">Dose</th>
            <th className="pr-3 pb-2">Route</th>
            <th className="pr-3 pb-2">Frequency</th>
            <th className="pr-3 pb-2">Duration</th>
            <th className="pr-3 pb-2">Start</th>
            <th className="pr-3 pb-2">End</th>
            <th className="pr-3 pb-2">Prescribing Doctor</th>
          </tr>
        </thead>
        <tbody>
          {meds.map((med) => (
            <tr key={med.id} className="border-b border-gray-100">
              <td className="py-2 pr-3 font-medium text-gray-900">{med.medication_name}</td>
              <td className="py-2 pr-3 text-gray-600">{med.dosage || "—"}</td>
              <td className="py-2 pr-3 text-gray-600">{med.route || "—"}</td>
              <td className="py-2 pr-3 text-gray-600">{med.frequency || "—"}</td>
              <td className="py-2 pr-3 text-gray-600">{med.duration || "—"}</td>
              <td className="py-2 pr-3 text-gray-600">{formatDateSafe(med.start_date)}</td>
              <td className="py-2 pr-3 text-gray-600">{formatDateSafe(med.end_date)}</td>
              <td className="py-2 pr-3 text-gray-600">{med.prescribing_doctor || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineBlock({ encounter }: { encounter: Encounter }) {
  const d = encounter;

  const dermatologyFields = [
    { label: "Chief Complaint", value: d.chief_complaint },
    { label: "Present Illness", value: d.present_illness },
    { label: "Symptoms", value: d.symptoms },
    { label: "Associated Symptoms", value: d.associated_symptoms },
    { label: "Duration", value: d.duration_ },
    { label: "Body Site", value: d.body_site },
    { label: "Lesion Description", value: d.lesion_description },
    { label: "Morphology", value: d.morphology },
    { label: "Distribution", value: d.distribution },
    { label: "Color", value: d.color },
    { label: "Borders", value: d.borders },
    { label: "Texture", value: d.texture },
    { label: "Scaling", value: d.scaling },
    { label: "Pigmentation", value: d.pigmentation },
    { label: "Tenderness", value: d.tenderness },
    { label: "Temperature", value: d.temperature },
    { label: "Findings", value: d.findings },
    { label: "General Examination", value: d.general_examination },
    { label: "Local Skin Examination", value: d.local_skin_examination },
    { label: "Plan", value: d.plan },
  ].filter((f) => f.value);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {d.encounter_number || "Consultation"}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(d.encounter_date).toLocaleString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {d.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <SectionHeading
            icon={<Stethoscope className="h-4 w-4" />}
            title="Dermatology Assessment"
          />
          {dermatologyFields.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">No dermatology data recorded.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dermatologyFields.map((f) => (
                <ReadOnlyField key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeading icon={<Pill className="h-4 w-4" />} title="Medications" />
          <div className="mt-3">
            <EncounterMedicationTable encounterId={d.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");

  const [activeTab, setActiveTab] = useState("overview");

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

  const completedEncounters = (encounters ?? [])
    .filter((e) => !!e.encounter_date)
    .sort((a, b) => new Date(b.encounter_date).getTime() - new Date(a.encounter_date).getTime());

  const allergyAlerts = (clinical?.alerts ?? []).filter(
    (a: MedicalAlert) => a.category === "allergy" && a.label,
  );

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

        <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => {
              setActiveTab("overview");
            }}
            className={`flex-1 rounded-md px-4 py-2.5 text-base font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Patient Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("timeline");
            }}
            className={`flex-1 rounded-md px-4 py-2.5 text-base font-medium transition-colors ${
              activeTab === "timeline"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Timeline
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-2xl font-bold text-gray-900">{patientName}</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField
                label="Age"
                value={computeAge(patient.dob) !== null ? `${computeAge(patient.dob)} yrs` : null}
              />
              <ReadOnlyField label="Gender" value={patient.gender} />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500">Contact Details</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Phone" value={patient.phone} />
                <ReadOnlyField label="Email" value={patient.email} />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ReadOnlyField label="Name" value={patient.emergency_contact_name} />
                <ReadOnlyField label="Phone" value={patient.emergency_contact_phone} />
                <ReadOnlyField
                  label="Relationship"
                  value={patient.emergency_contact_relationship}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            {allergyAlerts.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Active Clinical Alerts</h3>
                    <ul className="mt-1 list-inside list-disc text-sm text-red-700">
                      {allergyAlerts.map((a) => (
                        <li key={a.id}>
                          {a.label}
                          {a.severity ? ` (${a.severity})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {completedEncounters.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Stethoscope className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">No consultation history</p>
                <p className="mt-1 text-base text-gray-500">
                  Completed consultations will appear here with their Dermatology and Medications
                  data.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-3 bottom-3 left-5 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {completedEncounters.map((enc) => (
                    <div key={enc.id} className="relative flex gap-4">
                      <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-blue-700 shadow-sm">
                        <Stethoscope className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <TimelineBlock encounter={enc} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
