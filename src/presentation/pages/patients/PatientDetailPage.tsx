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
import { ArrowLeft, Pencil, Loader2, Stethoscope } from "lucide-react";

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

            {(encounters ?? []).length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <Stethoscope className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-3 text-base font-medium text-gray-900">No timeline entries</p>
                <p className="mt-1 text-base text-gray-500">
                  Encounter data will appear here after consultations.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {[...(encounters ?? [])]
                .sort(
                  (a, b) =>
                    new Date(b.encounter_date).getTime() - new Date(a.encounter_date).getTime(),
                )
                .map((e, i) => (
                  <div key={e.id} className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {e.encounter_number ?? `Consultation ${(encounters ?? []).length - i}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(e.encounter_date)} ·{" "}
                          <span className="capitalize">{e.status.replace("_", " ")}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <EMRField label="Chief Complaint" value={e.chief_complaint} />
                      <EMRField label="Present Illness" value={e.present_illness} />
                      <EMRField label="Duration" value={e.duration_} />
                      <EMRField label="Symptoms" value={e.symptoms} />
                      <EMRField label="Associated Symptoms" value={e.associated_symptoms} />
                      <EMRField label="General Examination" value={e.general_examination} />
                      <EMRField label="Local Skin Examination" value={e.local_skin_examination} />
                      <EMRField label="Body Site" value={e.body_site} />
                      <EMRField label="Lesion Description" value={e.lesion_description} />
                      <EMRField label="Morphology" value={e.morphology} />
                      <EMRField label="Distribution" value={e.distribution} />
                      <EMRField label="Color" value={e.color} />
                      <EMRField label="Borders" value={e.borders} />
                      <EMRField label="Texture" value={e.texture} />
                      <EMRField label="Scaling" value={e.scaling} />
                      <EMRField label="Pigmentation" value={e.pigmentation} />
                      <EMRField label="Tenderness" value={e.tenderness} />
                      <EMRField label="Temperature" value={e.temperature} />
                      <EMRField label="Follow-up Date" value={e.follow_up_date} />
                      <EMRField label="Follow-up Advice" value={e.follow_up_advice} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
