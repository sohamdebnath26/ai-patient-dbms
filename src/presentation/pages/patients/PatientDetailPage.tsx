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
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");

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
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
          </div>
        </PatientHeader>
      </div>
    </AppShell>
  );
}
