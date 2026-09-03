import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  usePatient,
  useArchivePatient,
  useDeregisterPatient,
} from "@presentation/hooks/usePatients";
import { useCreateEncounter, usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { CollapsibleSection } from "@presentation/components/CollapsibleSection";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
import { SectionHeading } from "@presentation/components/patient/helpers";
import { formatDate, computeAge } from "@presentation/components/patient/utils";
import {
  ArrowLeft,
  Pencil,
  Archive,
  UserRoundX,
  Loader2,
  User,
  Stethoscope,
  Pill,
  AlertTriangle,
  Clock,
  MapPin,
  HeartPulse,
  Users,
  Activity,
  ClipboardList,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  History,
} from "lucide-react";

function FieldDisplay({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const archiveMutation = useArchivePatient();
  const deregisterMutation = useDeregisterPatient();
  const createEncounter = useCreateEncounter();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const [deregisterOpen, setDeregisterOpen] = useState(false);

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
  const age = computeAge(patient.dob);

  const latestEncounter =
    (encounters ?? []).find((e) => e.status === "completed") ?? (encounters ?? [])[0] ?? null;
  const nextFollowUp = latestEncounter?.follow_up_date ?? null;
  const totalVisits = (encounters ?? []).filter((e) => e.status === "completed").length;

  const handleNewEncounter = () => {
    createEncounter.mutate(patient.id, {
      onSuccess: (encounter) => void navigate(`/encounters/${encounter.id}`),
    });
  };

  const prescriptionAvailable = (clinical?.medications.length ?? 0) > 0;
  const reportGenerated = (clinical?.labReports.length ?? 0) > 0;
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
      <div className="mx-auto max-w-4xl space-y-4">
        <button
          onClick={() => void navigate("/patients")}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
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
            {profile?.role === "doctor" &&
              patient.status !== "archived" &&
              patient.status !== "deregistered" && (
                <button
                  onClick={handleNewEncounter}
                  disabled={createEncounter.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {createEncounter.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                  New Encounter
                </button>
              )}
            {canEdit && (
              <button
                onClick={() => void navigate(`/patients/${patient.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            {patient.status !== "archived" &&
              patient.status !== "deregistered" &&
              profile?.role === "doctor" && (
                <>
                  <button
                    onClick={() => {
                      setDeregisterOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-orange-200 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
                  >
                    <UserRoundX className="h-4 w-4" /> Deregister
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Archive this patient?")) {
                        archiveMutation.mutate(patient.id);
                        void navigate("/patients");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                </>
              )}
          </div>
        </PatientHeader>

        {/* Demographics */}
        <CollapsibleSection title="Demographics" icon={<User className="h-4 w-4" />} defaultOpen>
          <div className="space-y-8">
            <div className="space-y-3">
              <SectionHeading icon={<User className="h-4 w-4" />} title="Personal Information" />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="First Name" value={patient.first_name} />
                <FieldDisplay label="Last Name" value={patient.last_name} />
                <FieldDisplay label="Date of Birth" value={patient.dob} />
                <FieldDisplay label="Age" value={age !== null ? `${age} yrs` : "—"} />
                <FieldDisplay label="Gender" value={patient.gender} />
                <FieldDisplay label="Blood Group" value={patient.blood_group} />
                <FieldDisplay label="MRN" value={patient.mrn} />
                <FieldDisplay label="Marital Status" value={patient.marital_status} />
                <FieldDisplay label="Occupation" value={patient.occupation} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<MapPin className="h-4 w-4" />} title="Address" />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Address Line 1" value={patient.address_line1} />
                <FieldDisplay label="Address Line 2" value={patient.address_line2} />
                <FieldDisplay label="Landmark" value={patient.landmark} />
                <FieldDisplay label="City" value={patient.city} />
                <FieldDisplay label="District" value={patient.district} />
                <FieldDisplay label="State" value={patient.state} />
                <FieldDisplay label="Country" value={patient.country} />
                <FieldDisplay label="Postal Code" value={patient.postal_code} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Phone className="h-4 w-4" />} title="Contact Information" />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Phone" value={patient.phone} />
                <FieldDisplay label="Email" value={patient.email} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Phone className="h-4 w-4" />} title="Emergency Contact" />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Name" value={patient.emergency_contact_name} />
                <FieldDisplay label="Phone" value={patient.emergency_contact_phone} />
                <FieldDisplay label="Relationship" value={patient.emergency_contact_relationship} />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Analysis */}
        <CollapsibleSection title="Analysis" icon={<HeartPulse className="h-4 w-4" />} defaultOpen>
          <div className="space-y-8">
            <div className="space-y-3">
              <SectionHeading icon={<HeartPulse className="h-4 w-4" />} title="Medical History" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldDisplay label="Chief Complaint" value={patient.chief_complaint} />
                <FieldDisplay label="Present Illness" value={patient.present_illness} />
                <FieldDisplay
                  label="Previous Skin Diseases"
                  value={patient.previous_skin_diseases}
                />
                <FieldDisplay label="Previous Surgeries" value={patient.previous_surgeries} />
                <FieldDisplay
                  label="Other Medical Conditions"
                  value={patient.other_medical_conditions}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Users className="h-4 w-4" />} title="Family History" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldDisplay
                  label="Family History of Skin Diseases"
                  value={patient.family_history_skin}
                />
                <FieldDisplay
                  label="Family History of Cancer"
                  value={patient.family_history_cancer}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Activity className="h-4 w-4" />} title="Lifestyle" />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Smoking Status" value={patient.smoking_status} />
                <FieldDisplay label="Alcohol Consumption" value={patient.alcohol_consumption} />
                {patient.gender?.toLowerCase() === "female" && (
                  <FieldDisplay label="Pregnancy Status" value={patient.pregnancy_status} />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<AlertTriangle className="h-4 w-4" />} title="Medical Alerts" />
              <div className="flex flex-wrap gap-2">
                {(clinical?.alerts ?? []).length > 0 ? (
                  clinical?.alerts.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                    >
                      {a.label}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No known alerts.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading
                icon={<Stethoscope className="h-4 w-4" />}
                title="Dermatology Assessment"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Primary Diagnosis" value={patient.primary_diagnosis} />
                <FieldDisplay label="Secondary Diagnosis" value={patient.secondary_diagnosis} />
                <FieldDisplay label="Skin Type (Fitzpatrick)" value={patient.skin_type} />
                <FieldDisplay label="Disease Severity" value={patient.disease_severity} />
                <FieldDisplay label="Date of Onset" value={patient.date_of_onset} />
                <FieldDisplay label="Duration" value={patient.duration} />
                <FieldDisplay label="Affected Body Areas" value={patient.affected_body_areas} />
                <FieldDisplay label="Symptoms" value={patient.symptoms} />
                <FieldDisplay label="Current Flare" value={patient.current_flare ? "Yes" : "No"} />
                <FieldDisplay
                  label="Previous Skin Cancer"
                  value={patient.previous_skin_cancer ? "Yes" : "No"}
                />
                <FieldDisplay label="Sun Exposure History" value={patient.sun_exposure_history} />
                <FieldDisplay
                  label="Cosmetic Product Usage"
                  value={patient.cosmetic_product_usage}
                />
                <FieldDisplay label="Occupational Exposure" value={patient.occupational_exposure} />
                <FieldDisplay label="Notes" value={patient.medical_notes} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading
                icon={<ClipboardList className="h-4 w-4" />}
                title="Current Treatment"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Current Treatment Plan" value={patient.current_treatment} />
                <FieldDisplay
                  label="Prescription Available"
                  value={prescriptionAvailable ? "Yes" : "No"}
                />
                <FieldDisplay label="Report Generated" value={reportGenerated ? "Yes" : "No"} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Pill className="h-4 w-4" />} title="Medications" />
              {(clinical?.medications ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="px-2 py-2 font-medium">Medication</th>
                        <th className="px-2 py-2 font-medium">Dose</th>
                        <th className="px-2 py-2 font-medium">Frequency</th>
                        <th className="px-2 py-2 font-medium">Duration</th>
                        <th className="px-2 py-2 font-medium">Start</th>
                        <th className="px-2 py-2 font-medium">End</th>
                        <th className="px-2 py-2 font-medium">Doctor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clinical?.medications.map((m) => (
                        <tr key={m.id}>
                          <td className="px-2 py-2 font-medium text-gray-900">
                            {m.medication_name}
                          </td>
                          <td className="px-2 py-2 text-gray-600">{m.dosage || "—"}</td>
                          <td className="px-2 py-2 text-gray-600">{m.frequency || "—"}</td>
                          <td className="px-2 py-2 text-gray-600">{m.duration || "—"}</td>
                          <td className="px-2 py-2 text-gray-600">{formatDate(m.start_date)}</td>
                          <td className="px-2 py-2 text-gray-600">{formatDate(m.end_date)}</td>
                          <td className="px-2 py-2 text-gray-600">{m.prescribing_doctor || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No active medications.</p>
              )}
            </div>

            <div className="space-y-3">
              <SectionHeading
                icon={<FlaskConical className="h-4 w-4" />}
                title="Laboratory Reports"
              />
              {(clinical?.labReports ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="px-2 py-2 font-medium">Report Name</th>
                        <th className="px-2 py-2 font-medium">Date</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clinical?.labReports.map((r) => (
                        <tr key={r.id}>
                          <td className="px-2 py-2 font-medium text-gray-900">{r.test_name}</td>
                          <td className="px-2 py-2 text-gray-600">{formatDate(r.report_date)}</td>
                          <td className="px-2 py-2">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No laboratory reports.</p>
              )}
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<FileText className="h-4 w-4" />} title="Clinical Notes" />
              {(clinical?.clinicalNotes ?? []).length > 0 ? (
                <div className="space-y-4">
                  {clinical?.clinicalNotes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium text-gray-700 capitalize">
                          {n.note_type} Note
                        </span>
                        <span>{formatDate(n.created_at)}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {n.subjective && (
                          <div className="flex gap-2">
                            <span className="text-xs font-bold text-gray-400">S</span>
                            <p className="flex-1 text-gray-700">{n.subjective}</p>
                          </div>
                        )}
                        {n.objective && (
                          <div className="flex gap-2">
                            <span className="text-xs font-bold text-gray-400">O</span>
                            <p className="flex-1 text-gray-700">{n.objective}</p>
                          </div>
                        )}
                        {n.assessment && (
                          <div className="flex gap-2">
                            <span className="text-xs font-bold text-gray-400">A</span>
                            <p className="flex-1 text-gray-700">{n.assessment}</p>
                          </div>
                        )}
                        {n.plan && (
                          <div className="flex gap-2">
                            <span className="text-xs font-bold text-gray-400">P</span>
                            <p className="flex-1 text-gray-700">{n.plan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No clinical notes yet.</p>
              )}
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<ImageIcon className="h-4 w-4" />} title="Clinical Images" />
              <p className="text-sm text-gray-400">
                Open the patient editor to view or upload clinical images.
              </p>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Calendar className="h-4 w-4" />} title="Visit Summary" />
              <div className="grid gap-4 sm:grid-cols-4">
                <FieldDisplay
                  label="Last Visit"
                  value={formatDate(latestEncounter?.encounter_date ?? null)}
                />
                <FieldDisplay label="Next Follow-up" value={formatDate(nextFollowUp)} />
                <FieldDisplay label="Total Visits" value={String(totalVisits)} />
                <FieldDisplay label="Assigned Doctor" value={assignedDoctor} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Clock className="h-4 w-4" />} title="Encounter History" />
              {encounters && encounters.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {encounters.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => void navigate(`/encounters/${e.id}`)}
                        className="flex w-full items-center justify-between py-2.5 text-sm hover:bg-gray-50"
                      >
                        <span className="text-gray-700">
                          {e.encounter_number ?? "Encounter"} · {formatDate(e.encounter_date)}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {e.status.replace("_", " ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No encounters recorded yet.</p>
              )}
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<History className="h-4 w-4" />} title="Audit" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldDisplay label="Created On" value={formatDate(patient.created_at)} />
                <FieldDisplay label="Last Updated" value={formatDate(patient.updated_at)} />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <ConfirmDialog
        open={deregisterOpen}
        title="Deregister Patient"
        message="Are you sure you want to deregister this patient?"
        confirmLabel="Deregister"
        confirmationText="DEREGISTER"
        loading={deregisterMutation.isPending}
        onCancel={() => {
          setDeregisterOpen(false);
        }}
        onConfirm={() => {
          deregisterMutation.mutate(patient.id, {
            onSuccess: () => {
              setDeregisterOpen(false);
              void navigate("/patients");
            },
          });
        }}
      />
    </AppShell>
  );
}
