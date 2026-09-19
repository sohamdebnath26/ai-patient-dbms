import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge, formatDate } from "@presentation/components/patient/utils";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";

const TABS = [
  { key: "overview", label: "Patient Overview" },
  { key: "timeline", label: "Timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface BodyAssessment {
  bodyArea: string;
  finding: string;
  severity: string;
  onsetDate: string;
  duration: string;
  symptoms: string;
  morphology: string;
  distribution: string;
}

function parseBodyAssessments(raw: string | null | undefined): BodyAssessment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Record<string, unknown>[])
      .filter((a) => typeof a.finding === "string" && a.finding)
      .map((a) => ({
        bodyArea: typeof a.bodyArea === "string" ? a.bodyArea : "",
        finding: typeof a.finding === "string" ? a.finding : "",
        severity: typeof a.severity === "string" ? a.severity : "",
        onsetDate: typeof a.onsetDate === "string" ? a.onsetDate : "",
        duration: typeof a.duration === "string" ? a.duration : "",
        symptoms: typeof a.symptoms === "string" ? a.symptoms : "",
        morphology: typeof a.morphology === "string" ? a.morphology : "",
        distribution: typeof a.distribution === "string" ? a.distribution : "",
      }));
  } catch {
    return [];
  }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: clinical } = usePatientClinicalData(id ?? "");

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

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

  const allergyList = (clinical?.alerts ?? [])
    .filter((a) => a.category === "allergy")
    .map((a) => a.label);
  const medList = clinical?.medications ?? [];
  const bodyAssessments = parseBodyAssessments(patient.family_history);

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
              onClick={() => void navigate(`/patients/${patient.id}/edit`)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" /> Start Consultation
            </button>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className={`flex-1 rounded-md px-4 py-2.5 text-base font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" value={`${patient.first_name} ${patient.last_name}`.trim()} />
              <Field label="DOB" value={formatDate(patient.dob)} />
              <Field label="Gender" value={patient.gender} />
              <Field label="Phone" value={patient.phone} />
              <Field label="Smoking" value={patient.smoking_status} />
              <Field label="Alcohol" value={patient.alcohol_consumption} />
              <Field
                label="Allergies"
                value={allergyList.length > 0 ? allergyList.join(", ") : null}
              />
              <Field label="Clinical Notes" value={patient.medical_notes} />
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Latest EMR</h2>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Age"
                  value={computeAge(patient.dob) !== null ? `${computeAge(patient.dob)} yrs` : null}
                />
                <Field label="Smoking" value={patient.smoking_status} />
                <Field label="Alcohol" value={patient.alcohol_consumption} />
                <Field
                  label="Allergies"
                  value={allergyList.length > 0 ? allergyList.join(", ") : null}
                />
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Body Assessments</h3>
                {bodyAssessments.length === 0 ? (
                  <p className="mt-2 text-base text-gray-400">No body assessments recorded.</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {bodyAssessments.map((a, i) => (
                      <div
                        key={a.bodyArea || i}
                        className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                      >
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">
                          Assessment {i + 1}
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Body Area" value={a.bodyArea} />
                          <Field label="Finding / Lesion" value={a.finding} />
                          <Field label="Severity" value={a.severity} />
                          <Field label="Onset Date" value={formatDate(a.onsetDate)} />
                          <Field label="Duration" value={a.duration} />
                          <Field label="Symptoms" value={a.symptoms} />
                          <Field label="Morphology" value={a.morphology} />
                          <Field label="Distribution" value={a.distribution} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Medications</h3>
                {medList.length === 0 ? (
                  <p className="mt-2 text-base text-gray-400">No medications recorded.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {medList.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2"
                      >
                        <span className="font-medium text-gray-900">{m.medication_name}</span>
                        {m.dosage && <span className="text-sm text-gray-600">{m.dosage}</span>}
                        {m.frequency && (
                          <span className="text-sm text-gray-600">{m.frequency}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
