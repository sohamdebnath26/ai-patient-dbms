import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge, formatDate } from "@presentation/components/patient/utils";
import { SectionHeading } from "@presentation/components/patient/helpers";
import { ArrowLeft, Pencil, Loader2, Stethoscope, Pill } from "lucide-react";

interface AssessmentCard {
  bodyArea: string;
  finding: string;
  severity: string;
  onsetDate: string;
  duration: string;
  symptoms: string;
  morphology: string;
  distribution: string;
}

interface EmrSnapshot {
  timestamp: string;
  data: { family_history?: string };
}

function parseSnapshots(raw: string | null | undefined): EmrSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as EmrSnapshot[];
  } catch {
    /* ignore */
  }
  return [];
}

function parseAssessments(raw: string | null | undefined): AssessmentCard[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as AssessmentCard[];
  } catch {
    /* ignore */
  }
  return [];
}

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
  const snapshots = parseSnapshots(patient.cosmetic_product_usage).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const currentMeds = clinical?.medications ?? [];

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
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            {snapshots.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Loader2 className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">No EMR records yet</p>
                <p className="mt-1 text-base text-gray-500">
                  Saved EMR records from consultations will appear here.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-3 bottom-3 left-5 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {snapshots.map((snapshot) => {
                    const assessments = parseAssessments(snapshot.data.family_history);

                    return (
                      <div key={snapshot.timestamp} className="relative flex gap-4">
                        <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                          <Stethoscope className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white">
                          <div className="border-b border-gray-100 px-6 py-4">
                            <p className="text-lg font-bold text-gray-900">EMR Record</p>
                            <p className="text-sm text-gray-500">
                              {new Date(snapshot.timestamp).toLocaleString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          <div className="space-y-6 p-6">
                            <div>
                              <SectionHeading
                                icon={<Stethoscope className="h-4 w-4" />}
                                title="Dermatology Assessment"
                              />
                              {assessments.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-400">
                                  No dermatology data recorded.
                                </p>
                              ) : (
                                <div className="mt-3 space-y-4">
                                  {assessments.map((a, i) => (
                                    <div
                                      key={i}
                                      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
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

                            <div>
                              <SectionHeading
                                icon={<Pill className="h-4 w-4" />}
                                title="Medications"
                              />
                              {currentMeds.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-400">
                                  No medications recorded.
                                </p>
                              ) : (
                                <div className="mt-3 overflow-x-auto">
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
                                        <th className="pr-3 pb-2">Doctor</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {currentMeds.map((med) => (
                                        <tr key={med.id} className="border-b border-gray-100">
                                          <td className="py-2 pr-3 font-medium text-gray-900">
                                            {med.medication_name}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.dosage || "—"}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.route || "—"}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.frequency || "—"}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.duration || "—"}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.start_date ? formatDate(med.start_date) : "—"}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.end_date ? formatDate(med.end_date) : "—"}
                                          </td>
                                          <td className="py-2 pr-3 text-gray-600">
                                            {med.prescribing_doctor || "—"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
