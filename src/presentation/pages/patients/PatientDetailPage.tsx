import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient, useDeregisterPatient } from "@presentation/hooks/usePatients";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import { computeAge, formatDate } from "@presentation/components/patient/utils";
import { SectionHeading } from "@presentation/components/patient/helpers";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  ChevronDown,
  Stethoscope,
  Pill,
  UserRoundX,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Info,
  Heart,
  Activity,
  Smile,
  AlertTriangle,
} from "lucide-react";

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

const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-800">{value.replace(/_/g, " ")}</p>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">{label}</span>
      <p className="mt-0.5 text-sm font-medium text-gray-800">{value.replace(/_/g, " ")}</p>
    </div>
  );
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const deregisterMutation = useDeregisterPatient();

  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<string>>(new Set());
  const [deregisterOpen, setDeregisterOpen] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);

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
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="py-16 text-center text-gray-400">Patient not found.</div>
      </AppShell>
    );
  }

  const canEdit = profile?.role === "doctor" || profile?.role === "receptionist";
  const patientName = `${patient.first_name} ${patient.last_name}`.trim();
  const initials =
    patient.first_name && patient.last_name
      ? `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase()
      : "?";
  const age = computeAge(patient.dob);

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
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => void navigate(`/patients/${patient.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-amber-200 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
              >
                <Pencil className="h-4 w-4" /> Start Consultation
              </button>
            )}
            <button
              onClick={() => {
                setShowPatientInfo(!showPatientInfo);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                showPatientInfo
                  ? "border-blue-400 bg-blue-50 text-blue-700 shadow-md"
                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Info className="h-4 w-4" /> Patient Info
            </button>
            {patient.status !== "deregistered" && profile?.role === "doctor" && (
              <button
                type="button"
                onClick={() => {
                  setDeregisterOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <UserRoundX className="h-4 w-4" /> Deregister
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
                  <span className="text-xl font-extrabold text-white">{initials}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    {patientName}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      {patient.mrn}
                    </span>
                    {age !== null && <span>{age} yrs</span>}
                    <span className="text-gray-300">&middot;</span>
                    <span className="capitalize">{patient.gender ?? "\u2014"}</span>
                    {patient.blood_group && (
                      <>
                        <span className="text-gray-300">&middot;</span>
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                          {patient.blood_group}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {patient.phone && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
                      <Phone className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="font-medium">{patient.email}</span>
                  </div>
                )}
                {patient.city && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                      <MapPin className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <span className="font-medium">{patient.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showPatientInfo && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                Patient Information
              </h2>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Smile className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold tracking-wide text-amber-600 uppercase">
                    Demographics
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoField label="First Name" value={patient.first_name} />
                  <InfoField label="Last Name" value={patient.last_name} />
                  <InfoField label="Date of Birth" value={patient.dob} />
                  <InfoField label="Age" value={age !== null ? `${age} yrs` : null} />
                  <InfoField label="Gender" value={patient.gender} />
                  <InfoField label="Blood Group" value={patient.blood_group} />
                  <InfoField label="MRN" value={patient.mrn} />
                  <InfoField label="Status" value={patient.status} />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-bold tracking-wide text-blue-600 uppercase">
                      Contact Details
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <InfoField label="Phone" value={patient.phone} />
                    <InfoField label="Email" value={patient.email} />
                  </div>
                </div>

                <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-violet-500" />
                    <h3 className="text-sm font-bold tracking-wide text-violet-600 uppercase">
                      Address
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <InfoField label="Line 1" value={patient.address_line1 || patient.address} />
                    <InfoField label="Line 2" value={patient.address_line2} />
                    <InfoField label="Landmark" value={patient.landmark} />
                    <InfoField label="City" value={patient.city} />
                    <InfoField label="District" value={patient.district} />
                    <InfoField label="State" value={patient.state} />
                    <InfoField label="Country" value={patient.country} />
                    <InfoField label="Postal Code" value={patient.postal_code} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold tracking-wide text-emerald-600 uppercase">
                    Medical History
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Chief Complaint" value={patient.chief_complaint} />
                  <InfoField label="Present Illness" value={patient.present_illness} />
                  <InfoField label="Primary Diagnosis" value={patient.primary_diagnosis} />
                  <InfoField label="Secondary Diagnosis" value={patient.secondary_diagnosis} />
                  <InfoField label="Chronic Conditions" value={patient.chronic_conditions} />
                  <InfoField
                    label="Other Medical Conditions"
                    value={patient.other_medical_conditions}
                  />
                  <InfoField
                    label="Previous Skin Diseases"
                    value={patient.previous_skin_diseases}
                  />
                  <InfoField label="Previous Surgeries" value={patient.previous_surgeries} />
                  {patient.previous_skin_cancer && (
                    <InfoField label="Skin Cancer History" value={patient.medical_notes} />
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <h3 className="text-sm font-bold tracking-wide text-rose-600 uppercase">
                      Lifestyle &amp; Family
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <InfoField label="Smoking Status" value={patient.smoking_status} />
                    <InfoField label="Alcohol Consumption" value={patient.alcohol_consumption} />
                    {patient.gender?.toLowerCase() === "female" && (
                      <InfoField label="Pregnancy Status" value={patient.pregnancy_status} />
                    )}
                    <InfoField label="Family History" value={patient.family_history} />
                    <InfoField label="Family History (Skin)" value={patient.family_history_skin} />
                    <InfoField
                      label="Family History (Cancer)"
                      value={patient.family_history_cancer}
                    />
                    <InfoField label="Sun Exposure History" value={patient.sun_exposure_history} />
                    <InfoField
                      label="Occupational Exposure"
                      value={patient.occupational_exposure}
                    />
                    <InfoField
                      label="Cosmetic Product Usage"
                      value={patient.cosmetic_product_usage}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-sky-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-500" />
                    <h3 className="text-sm font-bold tracking-wide text-cyan-600 uppercase">
                      Emergency Contact
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <InfoField label="Name" value={patient.emergency_contact_name} />
                    <InfoField label="Phone" value={patient.emergency_contact_phone} />
                    <InfoField
                      label="Relationship"
                      value={patient.emergency_contact_relationship}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => {
              setActiveTab("overview");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("timeline");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "timeline"
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Timeline
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-50 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <p className="text-xs font-bold tracking-wider text-amber-500 uppercase">
                  Demographics
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Age" value={age !== null ? `${age} yrs` : null} />
                  <Field label="Gender" value={patient.gender} />
                  <Field label="Blood Group" value={patient.blood_group} />
                  <Field label="MRN" value={patient.mrn} />
                </div>
              </div>

              <div className="rounded-xl border border-blue-50 bg-gradient-to-br from-blue-50 to-sky-50 p-4">
                <p className="text-xs font-bold tracking-wider text-blue-500 uppercase">
                  Contact Details
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Phone" value={patient.phone} />
                  <Field label="Email" value={patient.email} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-violet-50 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
              <p className="text-xs font-bold tracking-wider text-violet-500 uppercase">
                Emergency Contact
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              <div className="rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-white p-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                  <Calendar className="h-8 w-8 text-amber-400" />
                </div>
                <p className="mt-5 text-lg font-bold text-gray-900">No EMR records yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Saved EMR records from consultations will appear here.
                </p>
              </div>
            ) : (
              <div className="relative pl-10">
                <div className="absolute top-3 bottom-3 left-[10px] w-px bg-gradient-to-b from-amber-300 via-amber-200 to-transparent" />

                <div className="space-y-3">
                  {snapshots.map((snapshot) => {
                    const assessments = parseAssessments(snapshot.data.family_history);
                    const isExpanded = expandedSnapshots.has(snapshot.timestamp);

                    return (
                      <div key={snapshot.timestamp} className="relative">
                        <div className="absolute top-4 left-[-34px] z-10 h-[20px] w-[20px] rounded-full border-2 border-amber-400 bg-white shadow-sm" />

                        <div className="overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              toggleExpanded(snapshot.timestamp);
                            }}
                            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-amber-50/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                                EMR
                              </span>
                              <span className="text-sm font-bold text-gray-800">
                                {formatTimestamp(snapshot.timestamp)}
                              </span>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-amber-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-amber-50 bg-amber-50/30 px-5 py-5">
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
                                          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                                        >
                                          <h4 className="mb-3 text-sm font-bold text-amber-700">
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
                                    <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
                                      <table className="min-w-full text-sm">
                                        <thead>
                                          <tr className="bg-gray-50 text-left text-xs font-bold text-gray-400 uppercase">
                                            <th className="px-4 py-2.5">Medication</th>
                                            <th className="px-4 py-2.5">Dose</th>
                                            <th className="px-4 py-2.5">Route</th>
                                            <th className="px-4 py-2.5">Frequency</th>
                                            <th className="px-4 py-2.5">Duration</th>
                                            <th className="px-4 py-2.5">Start</th>
                                            <th className="px-4 py-2.5">End</th>
                                            <th className="px-4 py-2.5">Doctor</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                          {currentMeds.map((med) => (
                                            <tr key={med.id}>
                                              <td className="px-4 py-2.5 font-semibold text-gray-900">
                                                {med.medication_name}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.dosage || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.route || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.frequency || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.duration || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.start_date
                                                  ? formatDate(med.start_date)
                                                  : "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.end_date ? formatDate(med.end_date) : "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
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

      <ConfirmDialog
        open={deregisterOpen}
        title="Deregister Patient"
        message={`Are you sure you want to deregister ${patient.first_name} ${patient.last_name}? They will be removed from active views but historical records will be preserved.`}
        confirmLabel="Deregister"
        confirmationText="DEREGISTER"
        loading={deregisterMutation.isPending}
        onConfirm={() => {
          deregisterMutation.mutate(patient.id, {
            onSuccess: () => {
              setDeregisterOpen(false);
              void navigate("/patients");
            },
          });
        }}
        onCancel={() => {
          setDeregisterOpen(false);
        }}
      />
    </AppShell>
  );
}
