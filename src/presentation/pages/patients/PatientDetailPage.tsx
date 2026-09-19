import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { usePatient } from "@presentation/hooks/usePatients";
import { usePatientEncounters } from "@presentation/hooks/useEncounters";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { AppShell } from "@presentation/components/AppShell";
import { computeAge } from "@presentation/components/patient/utils";
import { ArrowLeft, Pencil, Loader2, X } from "lucide-react";
import { useProfile } from "@presentation/hooks/useProfile";

interface TimelineItem {
  timestamp: string;
  type: "snapshot" | "medication" | "allergy" | "clinical-note" | "encounter";
  data: Record<string, unknown>;
  id: string;
}

function parseTimelineSnapshots(raw: string | null | undefined): TimelineItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as TimelineItem[];
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

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: encounters } = usePatientEncounters(id ?? "");
  const { data: clinical } = usePatientClinicalData(id ?? "");

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

  const snapshots = parseTimelineSnapshots(patient.cosmetic_product_usage);

  const getCurrentTimestamp = () => new Date().toISOString();

  const timelineItems: TimelineItem[] = [
    ...snapshots.map((s, i) => ({ ...s, type: "snapshot" as const, id: `snapshot-${i}` })),
    ...(clinical?.medications || []).map((med) => ({
      data: { type: "medication", ...med },
      timestamp: getCurrentTimestamp(),
      type: "medication" as const,
      id: `med-${med.id}`,
    })),
    ...(clinical?.alerts || [])
      .filter((a) => a.category === "allergy")
      .map((alert) => ({
        data: { type: "allergy", ...alert },
        timestamp: getCurrentTimestamp(),
        type: "allergy" as const,
        id: `allergy-${alert.id}`,
      })),
    ...(clinical?.clinicalNotes || []).map((note) => ({
      data: { type: "clinical-note", ...note },
      timestamp: getCurrentTimestamp(),
      type: "clinical-note" as const,
      id: `note-${note.id}`,
    })),
    ...(encounters || []).map((e) => ({
      data: { type: "encounter", ...e },
      timestamp: e.encounter_date,
      type: "encounter" as const,
      id: `encounter-${e.id}`,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
            <h2 className="text-2xl font-bold text-gray-900">
              {`${patient.first_name} ${patient.last_name}`.trim()}
            </h2>

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
            <h2 className="text-lg font-semibold text-gray-700">Current Status</h2>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Body Assessments</h3>
              {(encounters ?? []).length === 0 ? (
                <p className="text-base text-gray-400">No body assessments recorded.</p>
              ) : (
                <div className="space-y-4">
                  {(encounters ?? []).map((enc) => {
                    const bodyAssessments = [
                      { label: "Body Site", value: enc.body_site },
                      { label: "Findings", value: enc.findings },
                      { label: "Lesion Description", value: enc.lesion_description },
                      { label: "Morphology", value: enc.morphology },
                      { label: "Distribution", value: enc.distribution },
                    ].filter((f) => f.value);
                    if (bodyAssessments.length === 0) return null;
                    return (
                      <div
                        key={enc.id}
                        className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                      >
                        <p className="mb-2 text-sm font-medium text-gray-500">
                          {new Date(enc.encounter_date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {enc.encounter_number ? ` — ${enc.encounter_number}` : ""}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {bodyAssessments.map((ba) => (
                            <Field key={ba.label} label={ba.label} value={ba.value} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 className="mt-6 mb-4 text-lg font-bold text-gray-900">Medications</h3>
              {(clinical?.medications ?? []).length === 0 ? (
                <p className="text-base text-gray-400">No medications recorded.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(clinical?.medications ?? []).map((med) => (
                    <div
                      key={med.id}
                      className="rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                    >
                      <p className="font-medium text-gray-900">{med.medication_name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-600">
                        {med.dosage && <span>{med.dosage}</span>}
                        {med.frequency && <span>{med.frequency}</span>}
                        {med.route && <span>{med.route}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-700">Timeline History</h2>

            {timelineItems.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <X className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-3 text-base font-medium text-gray-900">No timeline entries</p>
                <p className="mt-1 text-base text-gray-500">
                  Click Start Consultation to edit the EMR.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  timelineItems.reduce<Record<string, typeof timelineItems>>((acc, item) => {
                    const dateKey = new Date(item.timestamp).toDateString();
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(item);
                    return acc;
                  }, {}),
                ).map(([date, items]) => {
                  const uniqueThreads = new Map<string, typeof timelineItems>();
                  items.forEach((item) => {
                    if (
                      item.type === "encounter" &&
                      isRecord(item.data) &&
                      item.data.encounter_date
                    ) {
                      const threadKey = new Date(item.data.encounter_date).toDateString();
                      if (!uniqueThreads.has(threadKey)) uniqueThreads.set(threadKey, []);
                      uniqueThreads.get(threadKey)?.push(item);
                    } else {
                      const threadKey = item.timestamp;
                      if (!uniqueThreads.has(threadKey)) uniqueThreads.set(threadKey, []);
                      uniqueThreads.get(threadKey)?.push(item);
                    }
                  });

                  const sortedThreads = Array.from(uniqueThreads.entries()).sort(
                    ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime(),
                  );

                  return (
                    <div key={date} className="space-y-4">
                      <h3 className="border-b pb-2 text-lg font-semibold text-gray-700">
                        {new Date(date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      {sortedThreads.map(([threadDate, threadItems]) => {
                        const isSingleItem = threadItems.length === 1;
                        const hasMultipleSameDate =
                          new Set(threadItems.map((t) => new Date(t.timestamp).toDateString()))
                            .size > 1;

                        return (
                          <div key={threadDate} className="space-y-4">
                            {hasMultipleSameDate && !isSingleItem && (
                              <div className="ml-2 text-sm font-medium text-gray-500">
                                Thread:{" "}
                                {new Date(threadDate).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}

                            {threadItems.map((item, index) => {
                              const isSnapshot = item.type === "snapshot";
                              const title = isSnapshot
                                ? item.data.Name || "EMR Snapshot"
                                : item.type.charAt(0).toUpperCase() + item.type.slice(1);

                              const formatThreadDate = () => {
                                const itemDate = new Date(item.timestamp);
                                return itemDate.toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              };

                              const showDateSeparator =
                                !isSingleItem && index === 0 && !hasMultipleSameDate;

                              return (
                                <div key={item.id} className="relative">
                                  {showDateSeparator && (
                                    <div className="absolute top-0 bottom-0 -left-4 border-l-2 border-gray-200" />
                                  )}
                                  <div className="ml-4 rounded-xl border border-gray-200 bg-white p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                      <div>
                                        <p className="text-lg font-bold text-gray-900">{title}</p>
                                        <p className="text-sm text-gray-500">
                                          {formatThreadDate()}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                      {isSnapshot && (
                                        <>
                                          <Field label="Age" value={item.data.Age as string} />
                                          <Field
                                            label="Smoking"
                                            value={item.data.Smoking as string}
                                          />
                                          <Field
                                            label="Alcohol"
                                            value={item.data.Alcohol as string}
                                          />
                                          <Field
                                            label="Body Assessments"
                                            value={item.data.Body_Assessments as string}
                                          />
                                          <Field
                                            label="Medications"
                                            value={item.data.Medications as string}
                                          />
                                        </>
                                      )}

                                      {!isSnapshot && item.type === "medication" && (
                                        <>
                                          <Field
                                            label="Medication"
                                            value={item.data.medication_name as string}
                                          />
                                          <Field
                                            label="Dosage"
                                            value={item.data.dosage as string}
                                          />
                                          <Field
                                            label="Frequency"
                                            value={item.data.frequency as string}
                                          />
                                          <Field label="Route" value={item.data.route as string} />
                                        </>
                                      )}

                                      {!isSnapshot && item.type === "allergy" && (
                                        <>
                                          <Field
                                            label="Allergen"
                                            value={item.data.label as string}
                                          />
                                        </>
                                      )}

                                      {!isSnapshot && item.type === "clinical-note" && (
                                        <>
                                          <Field label="Note" value={item.data.note as string} />
                                        </>
                                      )}

                                      {!isSnapshot &&
                                        item.type === "encounter" &&
                                        isRecord(item.data) && (
                                          <>
                                            <Field
                                              label="Chief Complaint"
                                              value={item.data.chief_complaint as string}
                                            />
                                            <Field
                                              label="Present Illness"
                                              value={item.data.present_illness as string}
                                            />
                                            <Field
                                              label="Encounter Number"
                                              value={
                                                item.data.encounter_number ||
                                                `Consultation ${item.data.status as string}`
                                              }
                                            />
                                          </>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
