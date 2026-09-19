import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
import { formatDate } from "@presentation/components/patient/utils";
import { ArrowLeft, Pencil, Loader2, Stethoscope, X, Plus, Trash2 } from "lucide-react";

function parseTimelineSnapshots(
  raw: string | null | undefined,
): { timestamp: string; data: Record<string, unknown> }[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) return p as { timestamp: string; data: Record<string, unknown> }[];
  } catch {
    /* ignore */
  }
  return [];
}

const TABS = [
  { key: "overview", label: "Patient Overview" },
  { key: "timeline", label: "Timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function EMRField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}:</span>{" "}
      <span className="text-base text-gray-900">{value}</span>
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

  const latestEncounter =
    (encounters ?? []).find((e) => e.status === "completed") ?? (encounters ?? [])[0] ?? null;
  const nextFollowUp = latestEncounter?.follow_up_date ?? null;

  const assignedDoctor = profile?.firstName ? `Dr. ${profile.firstName} ${profile.lastName}` : "—";

  const allergyList = (clinical?.alerts ?? [])
    .filter((a) => a.category === "allergy")
    .map((a) => a.label);
  const medList = (clinical?.medications ?? []).map((m) => m.medication_name);

  const headerData: PatientHeaderData = {
    id: patient.id,
    firstName: patient.first_name,
    lastName: patient.last_name,
    dob: patient.dob,
    gender: patient.gender,
    bloodGroup: patient.blood_group,
    mrn: patient.mrn,
    status: patient.status,
    primaryDiagnosis: patient.primary_diagnosis,
    diseaseSeverity: patient.disease_severity,
    assignedDoctor,
  };

  const snapshots = parseTimelineSnapshots(patient.cosmetic_product_usage);

  const getCurrentTimestamp = () => new Date().toISOString();

  const timelineItems = [
    ...(snapshots || []).map((s, i) => ({ ...s, type: "snapshot" as const, index: i, id: `snapshot-${i}` })),
    ...(clinical?.medications || []).map((med) => ({ data: { type: "medication", ...med }, timestamp: getCurrentTimestamp(), type: "medication" as const, id: `med-${med.id}` })),
    ...(clinical?.alerts || []).filter((a) => a.category === "allergy").map((alert) => ({ data: { type: "allergy", ...alert }, timestamp: getCurrentTimestamp(), type: "allergy" as const, id: `allergy-${alert.id}` })),
    ...(clinical?.clinicalNotes || []).map((note) => ({ data: { type: "clinical-note", ...note }, timestamp: getCurrentTimestamp(), type: "clinical-note" as const, id: `note-${note.id}` })),
    ...(encounters ?? []).map((e) => ({ data: { type: "encounter", ...e }, timestamp: e.encounter_date, type: "encounter" as const, id: `encounter-${e.id}` })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <button
          onClick={() => void navigate("/patients")}
          className="inline-flex items-center gap-1 text-base text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

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
          <PatientHeader
            patient={headerData}
            showId
            allergies={allergyList}
            activeMedications={medList}
            previousSkinCancer={patient.previous_skin_cancer ?? false}
            lastVisit={latestEncounter?.encounter_date ?? null}
            nextFollowUp={nextFollowUp}
          >
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => void navigate(`/patients/${patient.id}/edit`)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" /> Start Consultation ({(encounters ?? []).length + 1}
                  )
                </button>
              )}
            </div>
          </PatientHeader>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Patient Timeline</h2>

            {timelineItems.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <Stethoscope className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-3 text-base font-medium text-gray-900">No timeline entries</p>
                <p className="mt-1 text-base text-gray-500">
                  Patient records will appear here as they're added.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {timelineItems.map((item) => {
                const isSnapshot = item.type === "snapshot";
                const isMedication = item.type === "medication";
                const isAllergy = item.type === "allergy";
                const isClinicalNote = item.type === "clinical-note";
                const isEncounter = item.type === "encounter";

                const getTitle = () => {
                  if (isSnapshot) return "Form Update";
                  if (isMedication) return "Medication Added";
                  if (isAllergy) return "Allergy Recorded";
                  if (isClinicalNote) return "Clinical Note";
                  if (isEncounter) return item.data.encounter_type || "Consultation";
                  return "Entry";
                };

                const getIcon = () => {
                  if (isSnapshot) return "📝";
                  if (isMedication) return "💊";
                  if (isAllergy) return "⚠️";
                  if (isClinicalNote) return "📋";
                  if (isEncounter) return "🩺";
                  return "•";
                };

                return (
                  <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getIcon()}</span>
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {isSnapshot
                              ? (item.data as Record<string, unknown>).first_name || (item.data as Record<string, unknown>).last_name
                                ? `Update by ${[(item.data as Record<string, unknown>).first_name, (item.data as Record<string, unknown>).last_name].filter(Boolean).join(" ")}`
                                : "Form Update"
                              : getTitle()
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {isSnapshot && (
                        <EMRField label="Name" value={`${(item.data as Record<string, unknown>).first_name || ""} ${(item.data as Record<string, unknown>).last_name || ""}`} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).primary_diagnosis === "string" && (item.data as Record<string, unknown>).primary_diagnosis && (
                        <EMRField label="Primary Diagnosis" value={(item.data as Record<string, unknown>).primary_diagnosis as string} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).dermatology_diagnosis === "string" && (item.data as Record<string, unknown>).dermatology_diagnosis && (
                        <EMRField label="Dermatology Diagnosis" value={(item.data as Record<string, unknown>).dermatology_diagnosis as string} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).chief_complaint === "string" && (item.data as Record<string, unknown>).chief_complaint && (
                        <EMRField label="Chief Complaint" value={(item.data as Record<string, unknown>).chief_complaint as string} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).symptoms === "string" && (item.data as Record<string, unknown>).symptoms && (
                        <EMRField label="Symptoms" value={(item.data as Record<string, unknown>).symptoms as string} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).present_illness === "string" && (item.data as Record<string, unknown>).present_illness && (
                        <EMRField label="Present Illness" value={(item.data as Record<string, unknown>).present_illness as string} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).medical_notes === "string" && (item.data as Record<string, unknown>).medical_notes && (
                        <EMRField label="Clinical Notes" value={(item.data as Record<string, unknown>).medical_notes as string} />
                      )}

                      {isSnapshot && typeof (item.data as Record<string, unknown>).current_treatment === "string" && (item.data as Record<string, unknown>).current_treatment && (
                        <EMRField label="Current Treatment" value={(item.data as Record<string, unknown>).current_treatment as string} />
                      )}

                      {isMedication && (
                        <EMRField label="Medication" value={item.data.medication_name} />
                      )}

                      {isMedication && typeof item.data.dosage === "string" && item.data.dosage && (
                        <EMRField label="Dosage" value={item.data.dosage} />
                      )}

                      {isMedication && typeof item.data.frequency === "string" && item.data.frequency && (
                        <EMRField label="Frequency" value={item.data.frequency} />
                      )}

                      {isMedication && typeof item.data.route === "string" && item.data.route && (
                        <EMRField label="Route" value={item.data.route} />
                      )}

                      {isMedication && typeof item.data.start_date === "string" && item.data.start_date && (
                        <EMRField label="Start Date" value={item.data.start_date} />
                      )}

                      {isMedication && typeof item.data.end_date === "string" && item.data.end_date && (
                        <EMRField label="End Date" value={item.data.end_date} />
                      )}

                      {isAllergy && (
                        <EMRField label="Allergen" value={item.data.label} />
                      )}

                      {isClinicalNote && (
                        <EMRField label="Note" value={item.data.note} />
                      )}

                      {isClinicalNote && typeof item.data.encounter_id === "string" && item.data.encounter_id && (
                        <EMRField label="Encounter ID" value={item.data.encounter_id} />
                      )}

                      {isEncounter && (
                        <EMRField label="Encounter Number" value={item.data.encounter_number || `Consultation ${item.data.status}`} />
                      )}

                      {isEncounter && typeof item.data.chief_complaint === "string" && item.data.chief_complaint && (
                        <EMRField label="Chief Complaint" value={item.data.chief_complaint} />
                      )}

                      {isEncounter && typeof item.data.present_illness === "string" && item.data.present_illness && (
                        <EMRField label="Present Illness" value={item.data.present_illness} />
                      )}

                      {isEncounter && typeof item.data.lesion_description === "string" && item.data.lesion_description && (
                        <EMRField label="Lesion Description" value={item.data.lesion_description} />
                      )}

                      {isEncounter && typeof item.data.morphology === "string" && item.data.morphology && (
                        <EMRField label="Morphology" value={item.data.morphology} />
                      )}

                      {isEncounter && typeof item.data.distribution === "string" && item.data.distribution && (
                        <EMRField label="Distribution" value={item.data.distribution} />
                      )}

                      {isEncounter && typeof item.data.color === "string" && item.data.color && (
                        <EMRField label="Color" value={item.data.color} />
                      )}

                      {isEncounter && typeof item.data.borders === "string" && item.data.borders && (
                        <EMRField label="Borders" value={item.data.borders} />
                      )}

                      {isEncounter && typeof item.data.texture === "string" && item.data.texture && (
                        <EMRField label="Texture" value={item.data.texture} />
                      )}

                      {isEncounter && typeof item.data.scaling === "string" && item.data.scaling && (
                        <EMRField label="Scaling" value={item.data.scaling} />
                      )}

                      {isEncounter && typeof item.data.pigmentation === "string" && item.data.pigmentation && (
                        <EMRField label="Pigmentation" value={item.data.pigmentation} />
                      )}

                      {isEncounter && typeof item.data.tenderness === "string" && item.data.tenderness && (
                        <EMRField label="Tenderness" value={item.data.tenderness} />
                      )}

                      {isEncounter && typeof item.data.temperature === "string" && item.data.temperature && (
                        <EMRField label="Temperature" value={item.data.temperature} />
                      )}

                      {isEncounter && typeof item.data.follow_up_date === "string" && item.data.follow_up_date && (
                        <EMRField label="Follow-up Date" value={item.data.follow_up_date} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
