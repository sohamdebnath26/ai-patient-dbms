import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge, formatDate } from "@presentation/components/patient/utils";
import { ArrowLeft, Pencil, Loader2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useProfile } from "@presentation/hooks/useProfile";

interface SnapshotData {
  first_name?: string;
  last_name?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  status?: string;
  mrn?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  chief_complaint?: string;
  present_illness?: string;
  chronic_conditions?: string;
  primary_diagnosis?: string;
  secondary_diagnosis?: string;
  previous_skin_diseases?: string;
  previous_surgeries?: string;
  other_medical_conditions?: string;
  previous_skin_cancer?: boolean;
  medical_notes?: string;
  skin_type?: string;
  affected_body_areas?: string;
  disease_severity?: string;
  duration?: string;
  current_flare?: boolean;
  current_treatment?: string;
  date_of_onset?: string;
  symptoms?: string;
  family_history?: string;
  family_history_skin?: string;
  family_history_cancer?: string;
  smoking_status?: string;
  alcohol_consumption?: string;
  pregnancy_status?: string;
  sun_exposure_history?: string;
  cosmetic_product_usage?: string;
  occupational_exposure?: string;
}

interface Snapshot {
  timestamp: string;
  data: SnapshotData;
  id: string;
}

function parseSnapshots(raw: string | null | undefined): Snapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return (parsed as Snapshot[]).filter((s) => {
        const item = s as Record<string, unknown>;
        return (
          typeof item.timestamp === "string" && typeof item.data === "object" && item.data !== null
        );
      });
    }
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

const Section = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
        }}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {open ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
};

function printSnapshotAsPdf(snapshot: Snapshot, patientName: string) {
  const d = snapshot.data;
  const date = new Date(snapshot.timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bodyAssessments: Record<string, string>[] = [];
  if (d.family_history) {
    try {
      const parsed = JSON.parse(d.family_history) as unknown;
      if (Array.isArray(parsed)) bodyAssessments.push(...(parsed as Record<string, string>[]));
    } catch {
      /* ignore */
    }
  }

  const row = (label: string, value: string | undefined | null) =>
    value ? `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>` : "";

  const baRows = bodyAssessments
    .map(
      (ba, i) => `
      <tr><td colspan="2" class="section-title">Assessment ${i + 1}</td></tr>
      ${row("Body Area", ba.bodyArea)}
      ${row("Finding / Lesion", ba.finding)}
      ${row("Severity", ba.severity)}
      ${row("Onset Date", ba.onsetDate)}
      ${row("Duration", ba.duration)}
      ${row("Symptoms", ba.symptoms)}
      ${row("Morphology", ba.morphology)}
      ${row("Distribution", ba.distribution)}
    `,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>EMR - ${patientName} - ${date}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; color: #111827; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .date { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .section-title { font-weight: 700; font-size: 14px; color: #1f2937; padding-top: 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 8px; vertical-align: top; }
  .lbl { color: #6b7280; font-size: 12px; white-space: nowrap; width: 200px; }
  .val { color: #111827; font-size: 13px; }
</style></head><body>
<h1>${patientName}</h1>
<div class="date">${date}</div>
<table>
  <tr><td colspan="2" class="section-title">Personal Information</td></tr>
  ${row("First Name", d.first_name)}${row("Last Name", d.last_name)}
  ${row("Date of Birth", d.dob)}${row("Gender", d.gender)}
  ${row("Blood Group", d.blood_group)}${row("MRN", d.mrn)}
  ${row("Email", d.email)}${row("Phone", d.phone)}

  <tr><td colspan="2" class="section-title">Address</td></tr>
  ${row("Address Line 1", d.address_line1)}${row("Address Line 2", d.address_line2)}
  ${row("Landmark", d.landmark)}${row("City", d.city)}
  ${row("District", d.district)}${row("State", d.state)}
  ${row("Country", d.country)}${row("Postal Code", d.postal_code)}

  <tr><td colspan="2" class="section-title">Emergency Contact</td></tr>
  ${row("Name", d.emergency_contact_name)}${row("Phone", d.emergency_contact_phone)}
  ${row("Relationship", d.emergency_contact_relationship)}

  <tr><td colspan="2" class="section-title">Medical History</td></tr>
  ${row("Chief Complaint", d.chief_complaint)}${row("Present Illness", d.present_illness)}
  ${row("Chronic Conditions", d.chronic_conditions)}${row("Primary Diagnosis", d.primary_diagnosis)}
  ${row("Secondary Diagnosis", d.secondary_diagnosis)}
  ${row("Previous Skin Diseases", d.previous_skin_diseases)}${row("Previous Surgeries", d.previous_surgeries)}
  ${row("Other Medical Conditions", d.other_medical_conditions)}
  ${row("Previous Skin Cancer", d.previous_skin_cancer ? "Yes" : "")}

  <tr><td colspan="2" class="section-title">Dermatology Assessment</td></tr>
  ${row("Skin Type", d.skin_type)}${row("Affected Body Areas", d.affected_body_areas)}
  ${row("Disease Severity", d.disease_severity)}${row("Duration", d.duration)}
  ${row("Current Flare", d.current_flare ? "Yes" : "")}${row("Current Treatment", d.current_treatment)}
  ${row("Date of Onset", d.date_of_onset)}${row("Symptoms", d.symptoms)}
  ${baRows}

  <tr><td colspan="2" class="section-title">Family History</td></tr>
  ${row("Family History Skin", d.family_history_skin)}${row("Family History Cancer", d.family_history_cancer)}

  <tr><td colspan="2" class="section-title">Lifestyle</td></tr>
  ${row("Smoking Status", d.smoking_status)}${row("Alcohol Consumption", d.alcohol_consumption)}
  ${row("Pregnancy Status", d.pregnancy_status)}${row("Sun Exposure", d.sun_exposure_history)}
  ${row("Cosmetic Product Usage", d.cosmetic_product_usage)}${row("Occupational Exposure", d.occupational_exposure)}

  <tr><td colspan="2" class="section-title">Clinical Notes</td></tr>
  ${row("Medical Notes", d.medical_notes)}
</table>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
}

function parseBodyAssessments(raw: string | null | undefined): Record<string, string>[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as Record<string, string>[];
  } catch {
    /* ignore */
  }
  return [];
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();

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
            {snapshots.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Download className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">No EMR records found</p>
                <p className="mt-1 text-base text-gray-500">
                  EMR snapshots are saved when you click Save on the patient edit page.
                </p>
              </div>
            ) : (
              snapshots.map((snapshot) => {
                const d = snapshot.data;
                const bodyAssessments = parseBodyAssessments(d.family_history);

                return (
                  <div
                    key={snapshot.timestamp}
                    id={`snapshot-${snapshot.timestamp}`}
                    className="rounded-xl border border-gray-200 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                      <div>
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
                      <button
                        type="button"
                        onClick={() => {
                          printSnapshotAsPdf(snapshot, patientName);
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                    </div>

                    <div className="space-y-1 p-6">
                      <Section title="Personal Information" defaultOpen>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="First Name" value={d.first_name} />
                          <Field label="Last Name" value={d.last_name} />
                          <Field label="Date of Birth" value={formatDate(d.dob)} />
                          <Field label="Gender" value={d.gender} />
                          <Field label="Blood Group" value={d.blood_group} />
                          <Field label="MRN" value={d.mrn} />
                        </div>
                      </Section>

                      <Section title="Contact & Address">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Email" value={d.email} />
                          <Field label="Phone" value={d.phone} />
                          <Field label="Address Line 1" value={d.address_line1} />
                          <Field label="Address Line 2" value={d.address_line2} />
                          <Field label="Landmark" value={d.landmark} />
                          <Field label="City" value={d.city} />
                          <Field label="District" value={d.district} />
                          <Field label="State" value={d.state} />
                          <Field label="Country" value={d.country} />
                          <Field label="Postal Code" value={d.postal_code} />
                        </div>
                      </Section>

                      <Section title="Emergency Contact">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <Field label="Name" value={d.emergency_contact_name} />
                          <Field label="Phone" value={d.emergency_contact_phone} />
                          <Field label="Relationship" value={d.emergency_contact_relationship} />
                        </div>
                      </Section>

                      <Section title="Medical History">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Chief Complaint" value={d.chief_complaint} />
                          <Field label="Present Illness" value={d.present_illness} />
                          <Field label="Chronic Conditions" value={d.chronic_conditions} />
                          <Field label="Primary Diagnosis" value={d.primary_diagnosis} />
                          <Field label="Secondary Diagnosis" value={d.secondary_diagnosis} />
                          <Field label="Previous Skin Diseases" value={d.previous_skin_diseases} />
                          <Field label="Previous Surgeries" value={d.previous_surgeries} />
                          <Field
                            label="Other Medical Conditions"
                            value={d.other_medical_conditions}
                          />
                          <Field
                            label="Previous Skin Cancer"
                            value={d.previous_skin_cancer ? "Yes" : null}
                          />
                        </div>
                      </Section>

                      <Section title="Dermatology Assessment">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Skin Type" value={d.skin_type} />
                          <Field label="Affected Body Areas" value={d.affected_body_areas} />
                          <Field label="Disease Severity" value={d.disease_severity} />
                          <Field label="Duration" value={d.duration} />
                          <Field label="Current Flare" value={d.current_flare ? "Yes" : null} />
                          <Field label="Current Treatment" value={d.current_treatment} />
                          <Field label="Date of Onset" value={formatDate(d.date_of_onset)} />
                          <Field label="Symptoms" value={d.symptoms} />
                        </div>
                        {bodyAssessments.length > 0 && (
                          <div className="mt-4 space-y-4">
                            {bodyAssessments.map((ba, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                              >
                                <h4 className="mb-3 text-sm font-semibold text-gray-700">
                                  Assessment {i + 1}
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <Field label="Body Area" value={ba.bodyArea} />
                                  <Field label="Finding / Lesion" value={ba.finding} />
                                  <Field label="Severity" value={ba.severity} />
                                  <Field label="Onset Date" value={formatDate(ba.onsetDate)} />
                                  <Field label="Duration" value={ba.duration} />
                                  <Field label="Symptoms" value={ba.symptoms} />
                                  <Field label="Morphology" value={ba.morphology} />
                                  <Field label="Distribution" value={ba.distribution} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Section>

                      <Section title="Family History">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Family History Skin" value={d.family_history_skin} />
                          <Field label="Family History Cancer" value={d.family_history_cancer} />
                        </div>
                      </Section>

                      <Section title="Lifestyle">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Smoking Status" value={d.smoking_status} />
                          <Field label="Alcohol Consumption" value={d.alcohol_consumption} />
                          <Field label="Pregnancy Status" value={d.pregnancy_status} />
                          <Field label="Sun Exposure History" value={d.sun_exposure_history} />
                          <Field label="Cosmetic Product Usage" value={d.cosmetic_product_usage} />
                          <Field label="Occupational Exposure" value={d.occupational_exposure} />
                        </div>
                      </Section>

                      <Section title="Clinical Notes">
                        <Field label="Medical Notes" value={d.medical_notes} />
                      </Section>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
