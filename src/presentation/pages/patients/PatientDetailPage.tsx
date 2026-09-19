import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge } from "@presentation/components/patient/utils";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Stethoscope,
  Pill,
  FileText,
  FlaskConical,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { useProfile } from "@presentation/hooks/useProfile";
import type { Encounter } from "@domain/encounter";
import type { Medication, MedicalAlert, ClinicalNote, LabReport } from "@domain/patient";

interface TimelineEvent {
  id: string;
  date: string;
  type: "encounter" | "medication" | "clinical-note" | "lab-report" | "alert";
  summary: string;
  detail: string | null;
  encounter?: Encounter;
  medication?: Medication;
  clinicalNote?: ClinicalNote;
  labReport?: LabReport;
  alert?: MedicalAlert;
}

function buildTimeline(
  encounters: Encounter[] | undefined,
  medications: Medication[] | undefined,
  clinicalNotes: ClinicalNote[] | undefined,
  labReports: LabReport[] | undefined,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const enc of encounters ?? []) {
    if (!enc.encounter_date) continue;
    const summary = enc.chief_complaint || "Consultation";
    events.push({
      id: `enc-${enc.id}`,
      date: enc.encounter_date,
      type: "encounter",
      summary,
      detail: [enc.present_illness, enc.findings, enc.body_site].filter(Boolean).join("; "),
      encounter: enc,
    });
  }

  for (const med of medications ?? []) {
    const date = med.start_date || "";
    if (!date) continue;
    events.push({
      id: `med-${med.id}`,
      date,
      type: "medication",
      summary: med.dosage ? `${med.medication_name} ${med.dosage}` : med.medication_name,
      detail: [
        med.frequency,
        med.route,
        med.duration,
        med.prescribing_doctor ? `Prescribed by: ${med.prescribing_doctor}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      medication: med,
    });
  }

  for (const note of clinicalNotes ?? []) {
    const date = note.created_at || "";
    if (!date) continue;
    const content = note.assessment || note.subjective || note.objective || "";
    events.push({
      id: `note-${note.id}`,
      date,
      type: "clinical-note",
      summary: note.note_type
        ? `${note.note_type.charAt(0).toUpperCase() + note.note_type.slice(1)} Note`
        : "Clinical Note",
      detail: content || null,
      clinicalNote: note,
    });
  }

  for (const lab of labReports ?? []) {
    const date = lab.report_date || "";
    if (!date) continue;
    events.push({
      id: `lab-${lab.id}`,
      date,
      type: "lab-report",
      summary: lab.result_summary ? `${lab.test_name}: ${lab.result_summary}` : lab.test_name,
      detail: [lab.lab_name ? `Lab: ${lab.lab_name}` : null, `Status: ${lab.status}`]
        .filter(Boolean)
        .join(" · "),
      labReport: lab,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
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

const typeConfig: Record<
  TimelineEvent["type"],
  { icon: React.ComponentType<{ className?: string }>; badge: string; color: string }
> = {
  encounter: {
    icon: Stethoscope,
    badge: "Consultation",
    color: "bg-blue-100 text-blue-700",
  },
  medication: {
    icon: Pill,
    badge: "Medication",
    color: "bg-green-100 text-green-700",
  },
  "clinical-note": {
    icon: FileText,
    badge: "Clinical Note",
    color: "bg-amber-100 text-amber-700",
  },
  "lab-report": {
    icon: FlaskConical,
    badge: "Lab Report",
    color: "bg-purple-100 text-purple-700",
  },
  alert: {
    icon: AlertTriangle,
    badge: "Alert",
    color: "bg-red-100 text-red-700",
  },
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");

  const [activeTab, setActiveTab] = useState("overview");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  function toggleExpand(eventId: string) {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
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

  const timelineEvents = buildTimeline(
    encounters,
    clinical?.medications,
    clinical?.clinicalNotes,
    clinical?.labReports,
  );

  const allergyAlerts = (clinical?.alerts ?? []).filter((a) => a.category === "allergy" && a.label);

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

            {timelineEvents.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">No clinical history yet</p>
                <p className="mt-1 text-base text-gray-500">
                  Clinical events will appear here as consultations, medications, notes, and lab
                  reports are recorded.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-5 w-0.5 bg-gray-200" />

                <div className="space-y-4">
                  {timelineEvents.map((event) => {
                    const config = typeConfig[event.type];
                    const Icon = config.icon;
                    const isExpanded = expandedEvents.has(event.id);

                    return (
                      <div key={event.id} className="relative flex gap-4">
                        <div
                          className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white ${config.color} shadow-sm`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              toggleExpand(event.id);
                            }}
                            className="w-full px-5 py-3 text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                                  >
                                    {config.badge}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(event.date).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                    {event.date.includes("T") &&
                                      ` at ${new Date(event.date).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}`}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {event.summary}
                                </p>
                                {!isExpanded && event.detail && (
                                  <p className="mt-0.5 truncate text-sm text-gray-500">
                                    {event.detail}
                                  </p>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-100 px-5 py-4">
                              {event.type === "encounter" && event.encounter && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field
                                      label="Chief Complaint"
                                      value={event.encounter.chief_complaint}
                                    />
                                    <Field
                                      label="Present Illness"
                                      value={event.encounter.present_illness}
                                    />
                                    <Field label="Body Site" value={event.encounter.body_site} />
                                    <Field label="Findings" value={event.encounter.findings} />
                                    <Field
                                      label="Lesion Description"
                                      value={event.encounter.lesion_description}
                                    />
                                    <Field label="Morphology" value={event.encounter.morphology} />
                                    <Field
                                      label="Distribution"
                                      value={event.encounter.distribution}
                                    />
                                    <Field label="Plan" value={event.encounter.plan} />
                                    <Field label="Status" value={event.encounter.status} />
                                  </div>
                                  <a
                                    href={`/appointments/${event.encounter.appointment_id}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (event.encounter?.appointment_id) {
                                        void navigate(
                                          `/appointments/${event.encounter.appointment_id}`,
                                        );
                                      }
                                    }}
                                    className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 text-sm font-medium"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View Full Consultation
                                  </a>
                                </div>
                              )}

                              {event.type === "medication" && event.medication && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <Field
                                    label="Medication"
                                    value={event.medication.medication_name}
                                  />
                                  <Field label="Dosage" value={event.medication.dosage} />
                                  <Field label="Frequency" value={event.medication.frequency} />
                                  <Field label="Route" value={event.medication.route} />
                                  <Field label="Duration" value={event.medication.duration} />
                                  <Field
                                    label="Prescribing Doctor"
                                    value={event.medication.prescribing_doctor}
                                  />
                                  <Field
                                    label="Instructions"
                                    value={event.medication.instructions}
                                  />
                                </div>
                              )}

                              {event.type === "clinical-note" && event.clinicalNote && (
                                <div className="space-y-3">
                                  <Field label="Subjective" value={event.clinicalNote.subjective} />
                                  <Field label="Objective" value={event.clinicalNote.objective} />
                                  <Field label="Assessment" value={event.clinicalNote.assessment} />
                                  <Field label="Plan" value={event.clinicalNote.plan} />
                                </div>
                              )}

                              {event.type === "lab-report" && event.labReport && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <Field label="Test Name" value={event.labReport.test_name} />
                                  <Field label="Status" value={event.labReport.status} />
                                  <Field
                                    label="Result Summary"
                                    value={event.labReport.result_summary}
                                  />
                                  <Field label="Lab" value={event.labReport.lab_name} />
                                </div>
                              )}
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
