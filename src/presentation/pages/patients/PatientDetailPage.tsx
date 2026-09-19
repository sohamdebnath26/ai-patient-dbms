import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient, useUpdatePatient } from "@presentation/hooks/usePatients";
import { usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
import { ArrowLeft, Pencil, Loader2, Save, Trash2 } from "lucide-react";

interface TimelineSnapshot {
  timestamp: string;
  data: Record<string, unknown>;
}

const TABS = [
  { key: "overview", label: "Patient Overview" },
  { key: "timeline", label: "Timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function parseSnapshots(raw: string | null | undefined): TimelineSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as TimelineSnapshot[];
  } catch {
    // ignore
  }
  return [];
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const updateMutation = useUpdatePatient();
  const toast = useToast();

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

  const snapshots = parseSnapshots(patient.cosmetic_product_usage);

  function handleSaveSnapshot() {
    if (!id) return;
    const snapshot: TimelineSnapshot = {
      timestamp: new Date().toISOString(),
      data: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        dob: patient.dob,
        gender: patient.gender,
        mrn: patient.mrn,
        phone: patient.phone,
        primary_diagnosis: patient.primary_diagnosis,
        disease_severity: patient.disease_severity,
        chief_complaint: patient.chief_complaint,
        present_illness: patient.present_illness,
        symptoms: patient.symptoms,
        current_treatment: patient.current_treatment,
        medical_notes: patient.medical_notes,
        smoking_status: patient.smoking_status,
        alcohol_consumption: patient.alcohol_consumption,
        other_medical_conditions: patient.other_medical_conditions,
      },
    };
    const newSnapshots = [...snapshots, snapshot];
    updateMutation.mutate(
      { id, input: { cosmetic_product_usage: JSON.stringify(newSnapshots) } },
      {
        onSuccess: () => {
          toast.success("EMR snapshot saved.");
        },
      },
    );
  }

  function handleDeleteSnapshot(index: number) {
    if (!id) return;
    const newSnapshots = snapshots.filter((_, i) => i !== index);
    updateMutation.mutate(
      { id, input: { cosmetic_product_usage: JSON.stringify(newSnapshots) } },
      {
        onSuccess: () => {
          toast.success("Snapshot deleted.");
        },
      },
    );
  }

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Patient Timeline</h2>
              <button
                onClick={handleSaveSnapshot}
                disabled={updateMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save EMR Snapshot
              </button>
            </div>

            {snapshots.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-base font-medium text-gray-900">No snapshots yet</p>
                <p className="mt-1 text-base text-gray-500">
                  Save a snapshot of the current patient EMR data.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {snapshots
                .slice()
                .reverse()
                .map((s, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-500">
                        {new Date(s.timestamp).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <button
                        onClick={() => {
                          handleDeleteSnapshot(snapshots.length - 1 - i);
                        }}
                        disabled={updateMutation.isPending}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        title="Delete snapshot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {typeof s.data.first_name === "string" && (
                        <p>
                          <span className="font-medium">Name:</span> {s.data.first_name}{" "}
                          {typeof s.data.last_name === "string" ? s.data.last_name : ""}
                        </p>
                      )}
                      {typeof s.data.dob === "string" && (
                        <p>
                          <span className="font-medium">DOB:</span> {s.data.dob}
                        </p>
                      )}
                      {typeof s.data.gender === "string" && (
                        <p>
                          <span className="font-medium">Gender:</span> {s.data.gender}
                        </p>
                      )}
                      {typeof s.data.primary_diagnosis === "string" && s.data.primary_diagnosis && (
                        <p className="col-span-2">
                          <span className="font-medium">Diagnosis:</span> {s.data.primary_diagnosis}
                        </p>
                      )}
                      {typeof s.data.chief_complaint === "string" && s.data.chief_complaint && (
                        <p className="col-span-2">
                          <span className="font-medium">Chief Complaint:</span>{" "}
                          {s.data.chief_complaint}
                        </p>
                      )}
                      {typeof s.data.symptoms === "string" && s.data.symptoms && (
                        <p>
                          <span className="font-medium">Symptoms:</span> {s.data.symptoms}
                        </p>
                      )}
                      {typeof s.data.current_treatment === "string" && s.data.current_treatment && (
                        <p>
                          <span className="font-medium">Treatment:</span> {s.data.current_treatment}
                        </p>
                      )}
                      {typeof s.data.smoking_status === "string" && s.data.smoking_status && (
                        <p>
                          <span className="font-medium">Smoking:</span> {s.data.smoking_status}
                        </p>
                      )}
                      {typeof s.data.alcohol_consumption === "string" &&
                        s.data.alcohol_consumption && (
                          <p>
                            <span className="font-medium">Alcohol:</span>{" "}
                            {s.data.alcohol_consumption}
                          </p>
                        )}
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
