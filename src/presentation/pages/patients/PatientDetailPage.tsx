import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge, formatDate } from "@presentation/components/patient/utils";
import { SectionHeading } from "@presentation/components/patient/helpers";
import { ArrowLeft, Pencil, Loader2, ChevronDown, Stethoscope, Pill } from "lucide-react";

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${day} ${month} ${year} \u2022 ${h12}:${mm} ${ampm}`;
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
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<string>>(new Set());

  function toggleExpanded(timestamp: string) {
    setExpandedSnapshots((prev) => {
      const next = new Set(prev);
      if (next.has(timestamp)) {
        next.delete(timestamp);
      } else {
        next.add(timestamp);
      }
      return next;
    });
  }

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
  const initials =
    patient.first_name && patient.last_name
      ? `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase()
      : "?";

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

        <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{patientName}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-brand-100 text-brand-700 flex h-12 w-12 items-center justify-center rounded-full text-base font-bold">
              {initials}
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => {
              setActiveTab("overview");
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("timeline");
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
          <div className="space-y-4">
            {snapshots.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Loader2 className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">No EMR records yet</p>
                <p className="mt-1 text-base text-gray-500">
                  Saved EMR records from consultations will appear here.
                </p>
              </div>
            ) : (
              <div className="relative pl-10">
                <div className="absolute top-2 bottom-2 left-[9px] w-0.5 bg-gray-200" />

                <div className="space-y-3">
                  {snapshots.map((snapshot) => {
                    const assessments = parseAssessments(snapshot.data.family_history);
                    const isExpanded = expandedSnapshots.has(snapshot.timestamp);

                    return (
                      <div key={snapshot.timestamp} className="relative">
                        <div className="absolute top-4 left-[-34px] z-10 h-[18px] w-[18px] rounded-full border-2 border-blue-500 bg-white" />

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              toggleExpanded(snapshot.timestamp);
                            }}
                            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                          >
                            <span className="text-sm font-semibold text-gray-900">
                              {formatTimestamp(snapshot.timestamp)}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-5">
                              <div className="space-y-6">
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
                                          className="rounded-lg border border-gray-200 bg-white p-4"
                                        >
                                          <h4 className="mb-3 text-sm font-semibold text-gray-700">
                                            Assessment {i + 1}
                                          </h4>
                                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Field label="Body Area" value={a.bodyArea} />
                                            <Field label="Finding / Lesion" value={a.finding} />
                                            <Field label="Severity" value={a.severity} />
                                            <Field
                                              label="Onset Date"
                                              value={formatDate(a.onsetDate)}
                                            />
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
                                                {med.dosage || "\u2014"}
                                              </td>
                                              <td className="py-2 pr-3 text-gray-600">
                                                {med.route || "\u2014"}
                                              </td>
                                              <td className="py-2 pr-3 text-gray-600">
                                                {med.frequency || "\u2014"}
                                              </td>
                                              <td className="py-2 pr-3 text-gray-600">
                                                {med.duration || "\u2014"}
                                              </td>
                                              <td className="py-2 pr-3 text-gray-600">
                                                {med.start_date
                                                  ? formatDate(med.start_date)
                                                  : "\u2014"}
                                              </td>
                                              <td className="py-2 pr-3 text-gray-600">
                                                {med.end_date ? formatDate(med.end_date) : "\u2014"}
                                              </td>
                                              <td className="py-2 pr-3 text-gray-600">
                                                {med.prescribing_doctor || "\u2014"}
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
                          )}
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
