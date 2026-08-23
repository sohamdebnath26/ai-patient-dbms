import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  useEncounter,
  useUpdateEncounter,
  useCompleteEncounter,
  useEncounterProcedures,
  useAddProcedure,
  useRemoveProcedure,
  usePatientEncounters,
} from "@presentation/hooks/useEncounters";
import { usePatient } from "@presentation/hooks/usePatients";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { CollapsibleSection } from "@presentation/components/CollapsibleSection";
import { EncounterTimeline } from "@presentation/components/encounter/EncounterTimeline";
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { LabReportsSection } from "@presentation/components/patient/LabReportsSection";
import { ClinicalImagesSection } from "@presentation/components/patient/ClinicalImagesSection";
import { SectionHeading } from "@presentation/components/patient/helpers";
import {
  inputClass,
  labelClass,
  computeAge,
  initials,
  type ClinicalImage,
} from "@presentation/components/patient/utils";
import {
  useEncounterDiagnoses,
  useAddEncounterDiagnosis,
  useRemoveEncounterDiagnosis,
  useEncounterMedications,
  useAddEncounterMedication,
  useRemoveEncounterMedication,
  useEncounterLabReports,
  useAddEncounterLabReport,
  useEncounterNotes,
  useAddEncounterNote,
} from "@presentation/hooks/useClinical";
import type { DiagnosisInput, ClinicalNoteInput, LabReportInput, Diagnosis } from "@domain/patient";
import type { ProcedureInput, ProcedureType } from "@domain/encounter";
import {
  ArrowLeft,
  Loader2,
  Stethoscope,
  Search,
  Edit3,
  Calendar,
  Activity,
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  FileText,
} from "lucide-react";

const emptyEncounterForm = {
  chief_complaint: "",
  present_illness: "",
  duration_: "",
  symptoms: "",
  associated_symptoms: "",
  general_examination: "",
  local_skin_examination: "",
  body_site: "",
  lesion_description: "",
  morphology: "",
  distribution: "",
  color: "",
  borders: "",
  texture: "",
  scaling: "",
  pigmentation: "",
  tenderness: "",
  temperature: "",
  follow_up_date: "",
  follow_up_advice: "",
  follow_up_warnings: "",
  follow_up_lifestyle_advice: "",
};

export function EncounterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: encounter, isLoading } = useEncounter(id ?? "");
  const { data: patient } = usePatient(encounter?.patient_id ?? "");
  const { profile } = useProfile();
  const updateMutation = useUpdateEncounter();
  const completeMutation = useCompleteEncounter();
  const encounters = usePatientEncounters(encounter?.patient_id ?? "");
  const procedures = useEncounterProcedures(id ?? "");
  const addProcedure = useAddProcedure(id ?? "");
  const removeProcedure = useRemoveProcedure(id ?? "");
  const diagnoses = useEncounterDiagnoses(id ?? "");
  const addDiagnosis = useAddEncounterDiagnosis(id ?? "", encounter?.patient_id ?? "");
  const removeDiagnosis = useRemoveEncounterDiagnosis(id ?? "");
  const encounterMeds = useEncounterMedications(id ?? "");
  const addEncounterMed = useAddEncounterMedication(id ?? "", encounter?.patient_id ?? "");
  const removeEncounterMed = useRemoveEncounterMedication(id ?? "");
  const encounterLabs = useEncounterLabReports(id ?? "");
  const addEncounterLab = useAddEncounterLabReport(id ?? "", encounter?.patient_id ?? "");
  const encounterNotes = useEncounterNotes(id ?? "");
  const addEncounterNote = useAddEncounterNote(id ?? "", encounter?.patient_id ?? "");

  const [form, setForm] = useState(emptyEncounterForm);
  const [images, setImages] = useState<ClinicalImage[]>([]);
  const [procedureDraft, setProcedureDraft] = useState({
    procedure_type: "cryotherapy" as ProcedureType,
    body_site: "",
    notes: "",
  });
  const [diagnosisDraft, setDiagnosisDraft] = useState({
    description: "",
    icd10_code: "",
    diagnosis_type: "primary",
    severity: "",
  });
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    if (encounter) {
      setForm({
        chief_complaint: encounter.chief_complaint ?? "",
        present_illness: encounter.present_illness ?? "",
        duration_: encounter.duration_ ?? "",
        symptoms: encounter.symptoms ?? "",
        associated_symptoms: encounter.associated_symptoms ?? "",
        general_examination: encounter.general_examination ?? "",
        local_skin_examination: encounter.local_skin_examination ?? "",
        body_site: encounter.body_site ?? "",
        lesion_description: encounter.lesion_description ?? "",
        morphology: encounter.morphology ?? "",
        distribution: encounter.distribution ?? "",
        color: encounter.color ?? "",
        borders: encounter.borders ?? "",
        texture: encounter.texture ?? "",
        scaling: encounter.scaling ?? "",
        pigmentation: encounter.pigmentation ?? "",
        tenderness: encounter.tenderness ?? "",
        temperature: encounter.temperature ?? "",
        follow_up_date: encounter.follow_up_date ?? "",
        follow_up_advice: encounter.follow_up_advice ?? "",
        follow_up_warnings: encounter.follow_up_warnings ?? "",
        follow_up_lifestyle_advice: encounter.follow_up_lifestyle_advice ?? "",
      });
    }
  }, [encounter]);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildUpdatePayload() {
    return {
      ...form,
      chief_complaint: form.chief_complaint || null,
      present_illness: form.present_illness || null,
    };
  }

  function handleSave() {
    if (!id) return;
    updateMutation.mutate({ id, input: buildUpdatePayload() });
  }

  function handleComplete() {
    if (!id) return;
    updateMutation.mutate(
      { id, input: buildUpdatePayload() },
      {
        onSuccess: () => {
          completeMutation.mutate(id, {
            onSuccess: () => void navigate(`/encounters/${id}`),
          });
        },
      },
    );
  }

  if (isLoading || !encounter) {
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const isActive = encounter.status === "in_progress";
  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";
  const doctorName = profile?.firstName ? `Dr. ${profile.firstName} ${profile.lastName}` : "—";
  const summaryAge = computeAge(patient?.dob ?? null);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <button
          onClick={() => void navigate(`/patients/${encounter.patient_id}`)}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient
        </button>

        {/* Header Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start gap-4 p-6">
            <div className="bg-brand-50 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full">
              <span className="text-brand-600 text-2xl font-semibold">
                {patient ? initials(patient.first_name, patient.last_name) : "PT"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{patientName}</h1>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    encounter.status === "in_progress"
                      ? "bg-green-50 text-green-700"
                      : encounter.status === "completed"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {encounter.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">MRN:</span>
                  <span className="font-mono font-medium text-gray-900">{patient?.mrn ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Age:</span>
                  <span className="font-medium text-gray-900">
                    {summaryAge !== null ? `${summaryAge} yrs` : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Gender:</span>
                  <span className="font-medium text-gray-900">{patient?.gender ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Blood:</span>
                  <span className="font-medium text-gray-900">{patient?.blood_group ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Encounter:</span>
                  <span className="font-medium text-gray-900">
                    {encounter.encounter_number ? `#${encounter.encounter_number}` : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Date:</span>
                  <span className="font-medium text-gray-900">{encounter.encounter_date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Doctor:</span>
                  <span className="font-medium text-gray-900">{doctorName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-xs text-gray-400">Diagnosis:</span>
                  <span className="truncate font-medium text-gray-900">
                    {patient?.primary_diagnosis ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {isActive && (
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-6 py-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Complete Encounter
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("medications")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                Prescriptions
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAi((v) => !v);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </button>
            </div>
          )}
        </div>

        {/* Assessment */}
        <CollapsibleSection title="Assessment" icon={<Search className="h-4 w-4" />} defaultOpen>
          <div className="space-y-8">
            <div className="space-y-3">
              <SectionHeading
                icon={<Search className="h-4 w-4" />}
                title="Chief Complaint & History"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField
                  label="Chief Complaint"
                  value={form.chief_complaint}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("chief_complaint", v);
                  }}
                />
                <TextAreaField
                  label="History of Present Illness"
                  value={form.present_illness}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("present_illness", v);
                  }}
                />
                <TextField
                  label="Duration"
                  value={form.duration_}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("duration_", v);
                  }}
                />
                <TextField
                  label="Symptoms"
                  value={form.symptoms}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("symptoms", v);
                  }}
                />
                <TextField
                  className="sm:col-span-2"
                  label="Associated Symptoms"
                  value={form.associated_symptoms}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("associated_symptoms", v);
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading
                icon={<Stethoscope className="h-4 w-4" />}
                title="Physical Examination"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField
                  className="sm:col-span-2"
                  label="General Examination"
                  value={form.general_examination}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("general_examination", v);
                  }}
                />
                <TextAreaField
                  className="sm:col-span-2"
                  label="Local Skin Examination"
                  value={form.local_skin_examination}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("local_skin_examination", v);
                  }}
                />
                <TextField
                  label="Body Site"
                  value={form.body_site}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("body_site", v);
                  }}
                />
                <TextField
                  label="Lesion Description"
                  value={form.lesion_description}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("lesion_description", v);
                  }}
                />
                <TextField
                  label="Morphology"
                  value={form.morphology}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("morphology", v);
                  }}
                />
                <TextField
                  label="Distribution"
                  value={form.distribution}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("distribution", v);
                  }}
                />
                <TextField
                  label="Color"
                  value={form.color}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("color", v);
                  }}
                />
                <TextField
                  label="Borders"
                  value={form.borders}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("borders", v);
                  }}
                />
                <TextField
                  label="Texture"
                  value={form.texture}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("texture", v);
                  }}
                />
                <TextField
                  label="Scaling"
                  value={form.scaling}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("scaling", v);
                  }}
                />
                <TextField
                  label="Pigmentation"
                  value={form.pigmentation}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("pigmentation", v);
                  }}
                />
                <TextField
                  label="Tenderness"
                  value={form.tenderness}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("tenderness", v);
                  }}
                />
                <TextField
                  label="Temperature"
                  value={form.temperature}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("temperature", v);
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeading
                icon={<Edit3 className="h-4 w-4" />}
                title="Diagnosis"
                badge={
                  diagnoses.data && diagnoses.data.length > 0 ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {diagnoses.data.length}
                    </span>
                  ) : undefined
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Description</th>
                      <th className="px-2 py-2">ICD-10</th>
                      <th className="px-2 py-2">Severity</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(diagnoses.data ?? []).map((d: Diagnosis) => (
                      <tr key={d.id}>
                        <td className="px-2 py-2">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                            {d.diagnosis_type}
                          </span>
                        </td>
                        <td className="px-2 py-2 font-medium text-gray-900">{d.description}</td>
                        <td className="px-2 py-2 font-mono text-xs text-gray-500">
                          {d.icd10_code || "—"}
                        </td>
                        <td className="px-2 py-2 text-gray-600">{d.severity || "—"}</td>
                        <td className="px-2 py-2 text-right">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                removeDiagnosis.mutate(d.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(diagnoses.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                          No diagnoses recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {isActive && (
                <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
                  <DiagnosisDraftField
                    label="Description"
                    value={diagnosisDraft.description}
                    onChange={(v) => {
                      setDiagnosisDraft((p) => ({ ...p, description: v }));
                    }}
                  />
                  <DiagnosisDraftField
                    label="ICD-10 Code"
                    value={diagnosisDraft.icd10_code}
                    onChange={(v) => {
                      setDiagnosisDraft((p) => ({ ...p, icd10_code: v }));
                    }}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Type</label>
                    <select
                      value={diagnosisDraft.diagnosis_type}
                      onChange={(e) => {
                        setDiagnosisDraft((p) => ({ ...p, diagnosis_type: e.target.value }));
                      }}
                      className={inputClass}
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="differential">Differential</option>
                    </select>
                  </div>
                  <DiagnosisDraftField
                    label="Severity"
                    value={diagnosisDraft.severity}
                    onChange={(v) => {
                      setDiagnosisDraft((p) => ({ ...p, severity: v }));
                    }}
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!diagnosisDraft.description.trim()) return;
                        const input: DiagnosisInput = {
                          description: diagnosisDraft.description.trim(),
                          icd10_code: diagnosisDraft.icd10_code || undefined,
                          diagnosis_type: diagnosisDraft.diagnosis_type,
                          severity: diagnosisDraft.severity || undefined,
                        };
                        addDiagnosis.mutate(input, {
                          onSuccess: () => {
                            setDiagnosisDraft({
                              description: "",
                              icd10_code: "",
                              diagnosis_type: "primary",
                              severity: "",
                            });
                          },
                        });
                      }}
                      disabled={!diagnosisDraft.description.trim() || addDiagnosis.isPending}
                      className="bg-brand-600 hover:bg-brand-700 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {addDiagnosis.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}{" "}
                      Add Diagnosis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Clinical Management */}
        <CollapsibleSection
          title="Clinical Management"
          icon={<Activity className="h-4 w-4" />}
          defaultOpen
        >
          <div className="space-y-8">
            <div id="medications">
              <MedicationSection
                medications={encounterMeds.data ?? []}
                adding={addEncounterMed.isPending}
                onAdd={(input) => {
                  addEncounterMed.mutate(input);
                }}
                onRemove={(id) => {
                  removeEncounterMed.mutate(id);
                }}
              />
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Activity className="h-4 w-4" />} title="Procedures" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Body Site</th>
                      <th className="px-2 py-2">Notes</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(procedures.data ?? []).map((p) => (
                      <tr key={p.id}>
                        <td className="px-2 py-2 font-medium text-gray-900 capitalize">
                          {p.procedure_type.replace("_", " ")}
                        </td>
                        <td className="px-2 py-2 text-gray-600">{p.body_site || "—"}</td>
                        <td className="px-2 py-2 text-gray-600">
                          {p.notes ? p.notes.slice(0, 50) : "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                removeProcedure.mutate(p.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(procedures.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                          No procedures recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {isActive && (
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Procedure</label>
                    <select
                      value={procedureDraft.procedure_type}
                      onChange={(e) => {
                        setProcedureDraft((p) => ({
                          ...p,
                          procedure_type: e.target.value as ProcedureType,
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="cryotherapy">Cryotherapy</option>
                      <option value="biopsy">Biopsy</option>
                      <option value="excision">Excision</option>
                      <option value="laser">Laser</option>
                      <option value="chemical_peel">Chemical Peel</option>
                      <option value="electrocautery">Electrocautery</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <TextField
                    label="Body Site"
                    value={procedureDraft.body_site}
                    disabled={!isActive}
                    onChange={(v) => {
                      setProcedureDraft((p) => ({ ...p, body_site: v }));
                    }}
                  />
                  <TextField
                    label="Notes"
                    value={procedureDraft.notes}
                    disabled={!isActive}
                    onChange={(v) => {
                      setProcedureDraft((p) => ({ ...p, notes: v }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input: ProcedureInput = {
                        procedure_type: procedureDraft.procedure_type,
                        body_site: procedureDraft.body_site || undefined,
                        notes: procedureDraft.notes || undefined,
                      };
                      addProcedure.mutate(
                        { patientId: encounter.patient_id, input },
                        {
                          onSuccess: () => {
                            setProcedureDraft({
                              procedure_type: "cryotherapy",
                              body_site: "",
                              notes: "",
                            });
                          },
                        },
                      );
                    }}
                    disabled={addProcedure.isPending}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {addProcedure.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}{" "}
                    Add Procedure
                  </button>
                </div>
              )}
            </div>

            <LabReportsSection
              reports={encounterLabs.data ?? []}
              onAdd={
                isActive
                  ? (input: LabReportInput) => {
                      addEncounterLab.mutate(input);
                    }
                  : undefined
              }
            />

            <ClinicalImagesSection
              images={images}
              onAdd={(file) => {
                const url = URL.createObjectURL(file);
                setImages((p) => [
                  ...p,
                  {
                    id: `${Date.now()}`,
                    url,
                    name: file.name,
                    uploadedAt: new Date().toISOString(),
                    bodyArea: "—",
                    diagnosis: "—",
                    notes: "",
                  },
                ]);
                return Promise.resolve();
              }}
              onRemove={(id) => {
                setImages((p) => p.filter((x) => x.id !== id));
                return Promise.resolve();
              }}
            />

            <div>
              <ClinicalNotesSection
                notes={encounterNotes.data ?? []}
                adding={addEncounterNote.isPending}
                onAdd={
                  isActive
                    ? (input: ClinicalNoteInput) => {
                        addEncounterNote.mutate(input);
                      }
                    : () => {}
                }
              />
            </div>

            <div className="space-y-3">
              <SectionHeading icon={<Calendar className="h-4 w-4" />} title="Follow-up" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Next Visit Date</label>
                  <input
                    type="date"
                    value={form.follow_up_date}
                    disabled={!isActive}
                    onChange={(e) => {
                      updateForm("follow_up_date", e.target.value);
                    }}
                    className={inputClass}
                  />
                </div>
                <div></div>
                <TextAreaField
                  label="Advice"
                  value={form.follow_up_advice}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("follow_up_advice", v);
                  }}
                />
                <TextAreaField
                  label="Warnings"
                  value={form.follow_up_warnings}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("follow_up_warnings", v);
                  }}
                />
                <TextAreaField
                  className="sm:col-span-2"
                  label="Lifestyle Advice"
                  value={form.follow_up_lifestyle_advice}
                  disabled={!isActive}
                  onChange={(v) => {
                    updateForm("follow_up_lifestyle_advice", v);
                  }}
                />
              </div>
            </div>

            {showAi && (
              <div className="space-y-3">
                <SectionHeading icon={<Sparkles className="h-4 w-4" />} title="AI Assistant" />
                <div className="border-brand-100 bg-brand-50/40 rounded-lg border p-4">
                  <p className="mb-3 text-sm text-gray-700">
                    AI-powered clinical decision support (available when AI backend is configured).
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Generate Visit Summary",
                      "Suggest Differential Diagnosis",
                      "Suggest Treatment",
                      "Drug Interaction Check",
                      "Generate Follow-up Instructions",
                      "Generate Referral Letter",
                      "Generate Patient Explanation",
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {}}
                        disabled
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <EncounterTimeline encounters={encounters.data ?? []} />
          </div>
        </CollapsibleSection>
      </div>
    </AppShell>
  );
}

function TextAreaField({
  label,
  value,
  disabled,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        rows={2}
        className={inputClass}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  disabled,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={inputClass}
      />
    </div>
  );
}

function DiagnosisDraftField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={inputClass}
      />
    </div>
  );
}
