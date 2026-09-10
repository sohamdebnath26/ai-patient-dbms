import { useParams, useNavigate, useSearchParams } from "react-router";
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
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Stethoscope,
  Pill,
  AlertTriangle,
  Calendar,
  MapPin,
  HeartPulse,
  Users,
  Activity,
  ClipboardList,
  FileText,
  History,
  Phone,
  Sun,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const TABS = [
  { key: "medical-overview", label: "Medical Overview" },
  { key: "contact", label: "Contact" },
  { key: "visits", label: "Visits" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "timeline", label: "Timeline" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ClinicalCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="text-brand-600 h-5 w-5" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="text-base text-gray-700">{children}</div>
    </div>
  );
}

function ClinicalItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="py-1.5">
      <span className="text-sm font-medium text-gray-500">{label}:</span>{" "}
      <span className="text-base text-gray-900">{value}</span>
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam && TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "medical-overview";
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

  function setTab(key: TabKey) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
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

        <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setTab(tab.key);
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

        {activeTab === "medical-overview" && (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <ClinicalCard icon={HeartPulse} title="Medical Conditions">
                <div className="space-y-2">
                  <ClinicalItem label="Primary Diagnosis" value={patient.primary_diagnosis} />
                  <ClinicalItem label="Secondary Diagnosis" value={patient.secondary_diagnosis} />
                  <ClinicalItem label="Chief Complaint" value={patient.chief_complaint} />
                  <ClinicalItem label="Present Illness" value={patient.present_illness} />
                  <ClinicalItem label="Date of Onset" value={patient.date_of_onset} />
                  <ClinicalItem label="Duration" value={patient.duration} />
                  <ClinicalItem label="Symptoms" value={patient.symptoms} />
                  <ClinicalItem label="Disease Severity" value={patient.disease_severity} />
                  {!patient.primary_diagnosis && !patient.chief_complaint && (
                    <p className="text-base text-gray-400">No medical conditions recorded.</p>
                  )}
                </div>
              </ClinicalCard>

              <ClinicalCard icon={Pill} title="Current Medications">
                {(clinical?.medications ?? []).length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {clinical?.medications.slice(0, 5).map((m) => (
                      <li key={m.id} className="flex justify-between py-2">
                        <span className="font-medium text-gray-900">{m.medication_name}</span>
                        <span className="text-gray-500">
                          {m.dosage}
                          {m.frequency ? ` · ${m.frequency}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-gray-400">No active medications.</p>
                )}
              </ClinicalCard>

              <ClinicalCard icon={AlertTriangle} title="Allergies">
                {allergyList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allergyList.map((a) => (
                      <span
                        key={a}
                        className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-gray-400">No known allergies.</p>
                )}
              </ClinicalCard>

              <ClinicalCard icon={Activity} title="Previous Skin Diseases">
                <ClinicalItem
                  label="Previous Skin Diseases"
                  value={patient.previous_skin_diseases}
                />
                <ClinicalItem
                  label="Previous Skin Cancer"
                  value={patient.previous_skin_cancer ? "Yes" : null}
                />
                <ClinicalItem label="Previous Surgeries" value={patient.previous_surgeries} />
                <ClinicalItem
                  label="Other Medical Conditions"
                  value={patient.other_medical_conditions}
                />
                {!patient.previous_skin_diseases &&
                  !patient.previous_surgeries &&
                  !patient.other_medical_conditions && (
                    <p className="text-base text-gray-400">No history recorded.</p>
                  )}
              </ClinicalCard>

              <ClinicalCard icon={Users} title="Family History">
                <ClinicalItem
                  label="Family History of Skin Diseases"
                  value={patient.family_history_skin}
                />
                <ClinicalItem
                  label="Family History of Cancer"
                  value={patient.family_history_cancer}
                />
                {!patient.family_history_skin && !patient.family_history_cancer && (
                  <p className="text-base text-gray-400">No family history recorded.</p>
                )}
              </ClinicalCard>

              <ClinicalCard icon={ClipboardList} title="Current Treatment">
                <ClinicalItem label="Treatment Plan" value={patient.current_treatment} />
                {!patient.current_treatment && (
                  <p className="text-base text-gray-400">No active treatment plan.</p>
                )}
              </ClinicalCard>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <ClinicalCard icon={Sun} title="Dermatology Assessment">
                <div className="space-y-2">
                  <ClinicalItem label="Skin Type (Fitzpatrick)" value={patient.skin_type} />
                  <ClinicalItem label="Affected Body Areas" value={patient.affected_body_areas} />
                  <ClinicalItem
                    label="Current Flare"
                    value={patient.current_flare ? "Yes" : null}
                  />
                  <ClinicalItem label="Sun Exposure" value={patient.sun_exposure_history} />
                  <ClinicalItem
                    label="Cosmetic Product Usage"
                    value={patient.cosmetic_product_usage}
                  />
                  <ClinicalItem
                    label="Occupational Exposure"
                    value={patient.occupational_exposure}
                  />
                  {!patient.skin_type &&
                    !patient.sun_exposure_history &&
                    !patient.cosmetic_product_usage && (
                      <p className="text-base text-gray-400">No dermatology assessment recorded.</p>
                    )}
                </div>
              </ClinicalCard>

              <ClinicalCard icon={Sparkles} title="Lifestyle">
                <div className="space-y-2">
                  <ClinicalItem label="Smoking" value={patient.smoking_status} />
                  <ClinicalItem label="Alcohol" value={patient.alcohol_consumption} />
                  {patient.gender?.toLowerCase() === "female" && (
                    <ClinicalItem label="Pregnancy Status" value={patient.pregnancy_status} />
                  )}
                  {!patient.smoking_status && !patient.alcohol_consumption && (
                    <p className="text-base text-gray-400">No lifestyle data recorded.</p>
                  )}
                </div>
              </ClinicalCard>
            </div>

            <ClinicalCard icon={FileText} title="Recent Clinical Notes">
              {(clinical?.clinicalNotes ?? []).length > 0 ? (
                <div className="space-y-4">
                  {clinical?.clinicalNotes.slice(0, 3).map((n) => (
                    <div key={n.id} className="rounded-lg border border-gray-100 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700 capitalize">
                          {n.note_type} Note
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(n.created_at)}</span>
                      </div>
                      <div className="space-y-1 text-base">
                        {n.subjective && (
                          <div className="flex gap-2">
                            <span className="text-sm font-bold text-gray-400">S</span>
                            <p className="text-gray-700">{n.subjective}</p>
                          </div>
                        )}
                        {n.objective && (
                          <div className="flex gap-2">
                            <span className="text-sm font-bold text-gray-400">O</span>
                            <p className="text-gray-700">{n.objective}</p>
                          </div>
                        )}
                        {n.assessment && (
                          <div className="flex gap-2">
                            <span className="text-sm font-bold text-gray-400">A</span>
                            <p className="text-gray-700">{n.assessment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-400">No clinical notes yet.</p>
              )}
            </ClinicalCard>

            <ClinicalCard icon={Calendar} title="Recent Visit / Consultation">
              {latestEncounter ? (
                <button
                  onClick={() => void navigate(`/encounters/${latestEncounter.id}`)}
                  className="w-full rounded-lg border border-gray-100 p-4 text-left hover:bg-gray-50"
                >
                  <p className="text-base font-semibold text-gray-900">
                    {latestEncounter.encounter_number ?? "Consultation"} ·{" "}
                    {formatDate(latestEncounter.encounter_date)}
                  </p>
                  <p className="mt-1 text-base text-gray-600">
                    Status:{" "}
                    <span className="capitalize">{latestEncounter.status.replace("_", " ")}</span>
                  </p>
                  {latestEncounter.chief_complaint && (
                    <p className="mt-1 text-base text-gray-500">
                      {latestEncounter.chief_complaint}
                    </p>
                  )}
                  {nextFollowUp && (
                    <p className="text-brand-600 mt-1 text-sm font-medium">
                      Follow-up: {formatDate(nextFollowUp)}
                    </p>
                  )}
                </button>
              ) : (
                <p className="text-base text-gray-400">No consultations recorded yet.</p>
              )}
            </ClinicalCard>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Phone className="text-brand-600 h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Phone" value={patient.phone} />
                <FieldDisplay label="Email" value={patient.email} />
                <FieldDisplay label="Marital Status" value={patient.marital_status} />
                <FieldDisplay label="Occupation" value={patient.occupation} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="text-brand-600 h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>
              </div>
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

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Users className="text-brand-600 h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldDisplay label="Name" value={patient.emergency_contact_name} />
                <FieldDisplay label="Phone" value={patient.emergency_contact_phone} />
                <FieldDisplay label="Relationship" value={patient.emergency_contact_relationship} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "visits" && (
          <div className="space-y-4">
            {encounters && encounters.length > 0 ? (
              encounters.map((e) => (
                <button
                  key={e.id}
                  onClick={() => void navigate(`/encounters/${e.id}`)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {e.encounter_number ?? "Consultation"} · {formatDate(e.encounter_date)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base text-gray-600">
                        {e.doctor_name && <span>{e.doctor_name}</span>}
                        {e.chief_complaint && <span>{e.chief_complaint.slice(0, 80)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          e.status === "in_progress"
                            ? "bg-green-50 text-green-700"
                            : e.status === "completed"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {e.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {e.follow_up_date && (
                    <p className="text-brand-600 mt-2 text-sm font-medium">
                      Follow-up: {formatDate(e.follow_up_date)}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <Stethoscope className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-3 text-base font-medium text-gray-900">No visits recorded</p>
                <p className="mt-1 text-base text-gray-500">
                  Consultation history will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            {(clinical?.medications ?? []).length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th className="px-5 py-3 font-semibold text-gray-600">Medication</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Dosage</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Frequency</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Duration</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Doctor</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Start</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clinical?.medications.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{m.medication_name}</td>
                        <td className="px-5 py-3 text-gray-700">{m.dosage || "—"}</td>
                        <td className="px-5 py-3 text-gray-700">{m.frequency || "—"}</td>
                        <td className="px-5 py-3 text-gray-700">{m.duration || "—"}</td>
                        <td className="px-5 py-3 text-gray-700">{m.prescribing_doctor || "—"}</td>
                        <td className="px-5 py-3 text-gray-600">{formatDate(m.start_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <Pill className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-3 text-base font-medium text-gray-900">No prescriptions</p>
                <p className="mt-1 text-base text-gray-500">
                  Prescription history will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" &&
          (() => {
            const timelineEntries = encounters ?? [];
            if (timelineEntries.length === 0) {
              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <History className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-3 text-base font-medium text-gray-900">No history</p>
                    <p className="mt-1 text-base text-gray-500">
                      Patient timeline will appear here after consultations.
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div className="space-y-4">
                <div className="space-y-3">
                  {timelineEntries
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.encounter_date).getTime() - new Date(a.encounter_date).getTime(),
                    )
                    .map((e, i) => (
                      <button
                        key={e.id}
                        onClick={() => void navigate(`/encounters/${e.id}`)}
                        className="relative flex w-full gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left hover:border-gray-300 hover:bg-gray-50"
                      >
                        <div className="flex flex-col items-center">
                          <div className="bg-brand-50 text-brand-700 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                            {i === 0 ? "Now" : i}
                          </div>
                          {i < timelineEntries.length - 1 && (
                            <div className="bg-brand-200 mt-1 h-full w-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">
                            {e.encounter_number ?? "Consultation"}
                          </p>
                          <p className="text-base text-gray-600">{formatDate(e.encounter_date)}</p>
                          {e.chief_complaint && (
                            <p className="mt-1 text-base text-gray-700">
                              {e.chief_complaint.slice(0, 100)}
                            </p>
                          )}
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              e.status === "completed"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {e.status.replace("_", " ")}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            );
          })()}
      </div>
    </AppShell>
  );
}
