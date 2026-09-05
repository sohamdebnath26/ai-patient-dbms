import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useEncounter,
  useUpdateEncounter,
  useCompleteEncounter,
  useEncounterProcedures,
  useAddProcedure,
  useRemoveProcedure,
  usePatientEncounters,
  useDeleteEncounter,
} from "@presentation/hooks/useEncounters";
import { usePatient } from "@presentation/hooks/usePatients";
import { useProfile } from "@presentation/hooks/useProfile";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { getSupabaseClient } from "@infrastructure/supabase/client";
import { AppShell } from "@presentation/components/AppShell";
import { CollapsibleSection } from "@presentation/components/CollapsibleSection";
import { EncounterTimeline } from "@presentation/components/encounter/EncounterTimeline";
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { LabReportsSection } from "@presentation/components/patient/LabReportsSection";
import { ClinicalImagesSection } from "@presentation/components/patient/ClinicalImagesSection";
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
import { TextAreaField, TextField, LoadingButton } from "@presentation/components/patient/helpers";
import { type ClinicalImage } from "@presentation/components/patient/utils";
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
import { useCompleteAppointment } from "@presentation/hooks/useAppointments";
import { useAuth } from "@presentation/hooks/useAuth";
import { useToast } from "@presentation/hooks/useToast";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import type { DiagnosisInput } from "@domain/patient";
import type { ProcedureInput, ProcedureType } from "@domain/encounter";
import {
  ArrowLeft,
  Loader2,
  Stethoscope,
  Edit3,
  Activity,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Ruler,
  Save,
  Brain,
} from "lucide-react";
import { DeepSeekProvider } from "@infrastructure/ai/DeepSeekProvider";
import { AIChatService } from "@application/ai/ChatService";

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

const PROCEDURE_TYPES: { value: ProcedureType; label: string }[] = [
  { value: "cryotherapy", label: "Cryotherapy" },
  { value: "biopsy", label: "Biopsy" },
  { value: "excision", label: "Excision" },
  { value: "laser", label: "Laser" },
  { value: "chemical_peel", label: "Chemical Peel" },
  { value: "electrocautery", label: "Electrocautery" },
  { value: "other", label: "Other" },
];

export function EncounterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: encounter, isLoading } = useEncounter(id ?? "");
  const { data: patient } = usePatient(encounter?.patient_id ?? "");
  const { profile } = useProfile();
  const toast = useToast();
  const updateMutation = useUpdateEncounter();
  const completeMutation = useCompleteEncounter();
  const completeApptMutation = useCompleteAppointment();
  const deleteMutation = useDeleteEncounter();
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
  const qc = useQueryClient();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();

  const { data: vital } = useQuery({
    queryKey: ["encounters", id, "vitals"],
    queryFn: async () => {
      if (!id) return null;
      const client = getSupabaseClient();
      const { data } = (await client
        .from("vitals")
        .select("*")
        .eq("encounter_id", id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as unknown as {
        data: {
          id: string;
          height_cm: number | null;
          weight_kg: number | null;
          bmi: number | null;
        } | null;
      };
      return data;
    },
    enabled: !!id,
  });

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    if (vital) {
      setHeight(vital.height_cm != null ? String(vital.height_cm) : "");
      setWeight(vital.weight_kg != null ? String(vital.weight_kg) : "");
    }
  }, [vital]);

  const saveVitals = useMutation({
    mutationFn: async () => {
      if (!id || !encounter) return;
      const client = getSupabaseClient();
      const h = height.trim() ? parseFloat(height) : null;
      const w = weight.trim() ? parseFloat(weight) : null;
      if (vital?.id) {
        const { error } = await client
          .from("vitals")
          .update({ height_cm: h, weight_kg: w })
          .eq("id", vital.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await client.from("vitals").insert({
          encounter_id: id,
          patient_id: encounter.patient_id,
          organization_id: selectedOrganizationId,
          clinic_id: selectedClinicId ?? null,
          created_by: user?.id,
          height_cm: h,
          weight_kg: w,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters", id, "vitals"] });
      toast.success("Measurements saved.");
    },
    onError: (e) => {
      setActionError(e instanceof Error ? e.message : "Failed to save measurements");
    },
  });

  const bmi = vital?.bmi ?? null;
  const computedBmi =
    bmi ??
    (() => {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      if (!h || !w || h <= 0) return null;
      return parseFloat((w / ((h / 100) * (h / 100))).toFixed(1));
    })();

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
  const [deleteOpen, setDeleteOpen] = useState(false);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  function buildEncounterContext(): string {
    const parts: string[] = [];
    if (form.chief_complaint) parts.push(`Chief Complaint: ${form.chief_complaint}`);
    if (form.present_illness) parts.push(`Present Illness: ${form.present_illness}`);
    if (form.duration_) parts.push(`Duration: ${form.duration_}`);
    if (form.symptoms) parts.push(`Symptoms: ${form.symptoms}`);
    if (form.associated_symptoms) parts.push(`Associated Symptoms: ${form.associated_symptoms}`);
    if (form.general_examination) parts.push(`General Examination: ${form.general_examination}`);
    if (form.local_skin_examination)
      parts.push(`Local Skin Examination: ${form.local_skin_examination}`);
    if (form.body_site) parts.push(`Body Site: ${form.body_site}`);
    if (form.lesion_description) parts.push(`Lesion Description: ${form.lesion_description}`);
    if (form.morphology) parts.push(`Morphology: ${form.morphology}`);
    if (form.distribution) parts.push(`Distribution: ${form.distribution}`);
    if (form.findings) parts.push(`Findings: ${form.findings}`);
    if (form.plan) parts.push(`Plan: ${form.plan}`);
    if (form.temperature) parts.push(`Temperature: ${form.temperature}`);
    if (computedBmi !== null) parts.push(`BMI: ${computedBmi}`);
    if (height.trim()) parts.push(`Height: ${height} cm`);
    if (weight.trim()) parts.push(`Weight: ${weight} kg`);
    if (diagnoses.data && diagnoses.data.length > 0) {
      parts.push(
        `Diagnoses: ${diagnoses.data.map((d: { description: string; icd10_code: string | null }) => `${d.description}${d.icd10_code ? ` (${d.icd10_code})` : ""}`).join("; ")}`,
      );
    }
    if (encounterMeds.data && encounterMeds.data.length > 0) {
      parts.push(
        `Medications: ${encounterMeds.data.map((m: { medication_name: string; dosage: string | null; frequency: string | null }) => `${m.medication_name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` ${m.frequency}` : ""}`).join("; ")}`,
      );
    }
    if (encounterLabs.data && encounterLabs.data.length > 0) {
      parts.push(
        `Labs: ${encounterLabs.data.map((l: { test_name: string; status: string }) => `${l.test_name} (${l.status})`).join("; ")}`,
      );
    }
    if (encounterNotes.data && encounterNotes.data.length > 0) {
      parts.push(
        `Notes: ${encounterNotes.data.map((n: { note_type: string; subjective: string | null; objective: string | null; assessment: string | null; plan: string | null }) => `${n.note_type}: ${n.subjective ?? ""} ${n.objective ?? ""} ${n.assessment ?? ""}`).join(" | ")}`,
      );
    }
    if (procedures.data && procedures.data.length > 0) {
      parts.push(
        `Procedures: ${procedures.data.map((p: { procedure_type: string; body_site: string | null }) => `${p.procedure_type}${p.body_site ? ` at ${p.body_site}` : ""}`).join("; ")}`,
      );
    }
    if (form.follow_up_date) parts.push(`Follow-up: ${form.follow_up_date}`);
    if (form.follow_up_advice) parts.push(`Follow-up Advice: ${form.follow_up_advice}`);
    return parts.join("\n");
  }

  async function handleGenerateAISummary() {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    setAiSummary(null);
    try {
      const provider = new DeepSeekProvider();
      const aiService = new AIChatService(provider);
      const context = buildEncounterContext();
      const response = await aiService.chat(
        `Generate a structured clinical summary from the following encounter data. Use markdown formatting with clear section headers (## Summary, ## History, ## Examination, ## Assessment, ## Plan). Be concise and clinical.\n\n${context}`,
        {
          systemPrompt: `You are a clinical AI assistant helping a doctor document an encounter. Generate a structured clinical summary from the provided encounter data. Format with markdown. Sections should include: Summary, History, Examination, Assessment, and Plan. Only reference data explicitly provided. Do not fabricate findings. Label all output as AI-generated.`,
          history: [],
        },
      );
      setAiSummary(response.message);
    } catch (e) {
      setAiSummaryError(e instanceof Error ? e.message : "Failed to generate AI summary");
    } finally {
      setAiSummaryLoading(false);
    }
  }

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

  const [actionError, setActionError] = useState<string | null>(null);

  function handleSave() {
    if (!id) return;
    setActionError(null);
    updateMutation.mutate(
      { id, input: buildUpdatePayload() },
      {
        onError: (e) => {
          setActionError(e instanceof Error ? e.message : "Save failed");
        },
        onSuccess: () => {
          toast.success("Encounter saved.");
        },
      },
    );
  }

  async function handleComplete() {
    if (!id || !user) return;
    setActionError(null);
    try {
      await updateMutation.mutateAsync({ id, input: buildUpdatePayload() });
      await completeMutation.mutateAsync(id);
      if (encounter?.appointment_id) {
        await completeApptMutation.mutateAsync({ id: encounter.appointment_id, userId: user.id });
      }
      toast.success("Encounter completed.");
      void navigate(`/patients/${encounter?.patient_id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to complete encounter");
    }
  }

  async function handleDelete() {
    if (!id) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Encounter deleted.");
      void navigate("/encounters");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete encounter");
    }
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

  const headerData: PatientHeaderData = patient
    ? {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dob: patient.dob,
        gender: patient.gender,
        bloodGroup: patient.blood_group,
        mrn: patient.mrn,
        status: patient.status,
        primaryDiagnosis: encounter.chief_complaint ?? patient.primary_diagnosis,
        diseaseSeverity: patient.disease_severity,
        assignedDoctor: profile?.firstName
          ? `Dr. ${profile.firstName} ${profile.lastName}`
          : undefined,
      }
    : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-4">
        <button
          type="button"
          onClick={() => {
            void navigate(`/patients/${encounter.patient_id}`);
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patient
        </button>

        <PatientHeader
          patient={headerData}
          showId
          subtitle={`Encounter · ${encounter.encounter_date} · ${encounter.encounter_number ?? "#" + encounter.id.slice(0, 8)}`}
        >
          {isActive && (
            <div className="flex items-center gap-2">
              <LoadingButton
                onClick={handleSave}
                loading={updateMutation.isPending}
                icon={<Save className="h-4 w-4" />}
                label="Save Draft"
                variant="secondary"
              />
              <LoadingButton
                onClick={() => {
                  void handleComplete();
                }}
                loading={completeMutation.isPending}
                icon={<CheckCircle className="h-4 w-4" />}
                label="Complete Encounter"
              />
              <button
                type="button"
                onClick={() => {
                  setShowAi((v) => !v);
                }}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${showAi ? "bg-purple-100 text-purple-700" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <Sparkles className="h-4 w-4" /> AI
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(true);
                }}
                className="rounded-md p-1.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </PatientHeader>

        {actionError && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <CollapsibleSection
              title="Current Visit"
              icon={<Stethoscope className="h-4 w-4" />}
              defaultOpen
            >
              <div className="grid grid-cols-2 gap-3">
                <TextAreaField
                  label="Chief Complaint"
                  value={form.chief_complaint}
                  onChange={(v) => {
                    updateForm("chief_complaint", v);
                  }}
                  disabled={!isActive}
                />
                <TextAreaField
                  label="Present Illness"
                  value={form.present_illness}
                  onChange={(v) => {
                    updateForm("present_illness", v);
                  }}
                  disabled={!isActive}
                />
                <TextField
                  label="Duration"
                  value={form.duration_}
                  onChange={(v) => {
                    updateForm("duration_", v);
                  }}
                  disabled={!isActive}
                />
                <TextField
                  label="Symptoms"
                  value={form.symptoms}
                  onChange={(v) => {
                    updateForm("symptoms", v);
                  }}
                  disabled={!isActive}
                />
                <TextField
                  label="Associated Symptoms"
                  value={form.associated_symptoms}
                  onChange={(v) => {
                    updateForm("associated_symptoms", v);
                  }}
                  disabled={!isActive}
                  span="full"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Examination"
              icon={<Activity className="h-4 w-4" />}
              defaultOpen
            >
              <div className="grid gap-3">
                <TextAreaField
                  label="General Examination"
                  value={form.general_examination}
                  onChange={(v) => {
                    updateForm("general_examination", v);
                  }}
                  disabled={!isActive}
                  span="full"
                />
                <TextAreaField
                  label="Local Skin Examination"
                  value={form.local_skin_examination}
                  onChange={(v) => {
                    updateForm("local_skin_examination", v);
                  }}
                  disabled={!isActive}
                  span="full"
                />
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="Body Site"
                    value={form.body_site}
                    onChange={(v) => {
                      updateForm("body_site", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Lesion Description"
                    value={form.lesion_description}
                    onChange={(v) => {
                      updateForm("lesion_description", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Morphology"
                    value={form.morphology}
                    onChange={(v) => {
                      updateForm("morphology", v);
                    }}
                    disabled={!isActive}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="Distribution"
                    value={form.distribution}
                    onChange={(v) => {
                      updateForm("distribution", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Color"
                    value={form.color}
                    onChange={(v) => {
                      updateForm("color", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Borders"
                    value={form.borders}
                    onChange={(v) => {
                      updateForm("borders", v);
                    }}
                    disabled={!isActive}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="Texture"
                    value={form.texture}
                    onChange={(v) => {
                      updateForm("texture", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Scaling"
                    value={form.scaling}
                    onChange={(v) => {
                      updateForm("scaling", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Pigmentation"
                    value={form.pigmentation}
                    onChange={(v) => {
                      updateForm("pigmentation", v);
                    }}
                    disabled={!isActive}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Tenderness"
                    value={form.tenderness}
                    onChange={(v) => {
                      updateForm("tenderness", v);
                    }}
                    disabled={!isActive}
                  />
                  <TextField
                    label="Temperature"
                    value={form.temperature}
                    onChange={(v) => {
                      updateForm("temperature", v);
                    }}
                    disabled={!isActive}
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Measurements" icon={<Ruler className="h-4 w-4" />}>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                    }}
                    disabled={!isActive}
                    className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                    }}
                    disabled={!isActive}
                    className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">BMI</label>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900">
                    {computedBmi ?? "—"}
                    {computedBmi != null && (
                      <span
                        className={`ml-2 text-xs font-medium ${computedBmi < 18.5 ? "text-yellow-600" : computedBmi < 25 ? "text-green-600" : computedBmi < 30 ? "text-orange-600" : "text-red-600"}`}
                      >
                        {computedBmi < 18.5
                          ? "Underweight"
                          : computedBmi < 25
                            ? "Normal"
                            : computedBmi < 30
                              ? "Overweight"
                              : "Obese"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {isActive && (
                <LoadingButton
                  onClick={() => {
                    void saveVitals.mutateAsync();
                  }}
                  loading={saveVitals.isPending}
                  disabled={!height.trim() && !weight.trim()}
                  icon={null}
                  label="Save Measurements"
                  variant="secondary"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Diagnosis"
              icon={<FileText className="h-4 w-4" />}
              badge={
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {diagnoses.data?.length ?? 0}
                </span>
              }
              defaultOpen
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="px-2 py-2 font-medium">Diagnosis</th>
                      <th className="px-2 py-2 font-medium">ICD-10</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Severity</th>
                      <th className="px-2 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(diagnoses.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                          No diagnoses recorded.
                        </td>
                      </tr>
                    )}
                    {(diagnoses.data ?? []).map((d) => (
                      <tr key={d.id}>
                        <td className="px-2 py-2 font-medium text-gray-900">{d.description}</td>
                        <td className="px-2 py-2 font-mono text-xs text-gray-500">
                          {d.icd10_code ?? "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                            {d.diagnosis_type}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-gray-600 capitalize">{d.severity || "—"}</td>
                        <td className="px-2 py-2 text-right">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                removeDiagnosis.mutate(d.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isActive && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600">Description</label>
                    <input
                      value={diagnosisDraft.description}
                      onChange={(e) => {
                        setDiagnosisDraft((prev) => ({ ...prev, description: e.target.value }));
                      }}
                      className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:outline-none"
                    />
                  </div>
                  <TextField
                    label="ICD-10 Code"
                    value={diagnosisDraft.icd10_code}
                    onChange={(v) => {
                      setDiagnosisDraft((prev) => ({ ...prev, icd10_code: v }));
                    }}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Type</label>
                    <select
                      value={diagnosisDraft.diagnosis_type}
                      onChange={(e) => {
                        setDiagnosisDraft((prev) => ({ ...prev, diagnosis_type: e.target.value }));
                      }}
                      className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:outline-none"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="differential">Differential</option>
                    </select>
                  </div>
                  <TextField
                    label="Severity"
                    value={diagnosisDraft.severity}
                    onChange={(v) => {
                      setDiagnosisDraft((prev) => ({ ...prev, severity: v }));
                    }}
                  />
                  <div className="col-span-2">
                    <LoadingButton
                      onClick={() => {
                        if (!diagnosisDraft.description.trim()) return;
                        const input: DiagnosisInput = {
                          description: diagnosisDraft.description.trim(),
                          icd10_code: diagnosisDraft.icd10_code.trim() || undefined,
                          diagnosis_type: diagnosisDraft.diagnosis_type,
                          status: "active",
                          severity: diagnosisDraft.severity.trim() || undefined,
                        };
                        void addDiagnosis.mutateAsync(input).then(() => {
                          setDiagnosisDraft({
                            description: "",
                            icd10_code: "",
                            diagnosis_type: "primary",
                            severity: "",
                          });
                        });
                      }}
                      loading={addDiagnosis.isPending}
                      disabled={!diagnosisDraft.description.trim()}
                      icon={<Plus className="h-4 w-4" />}
                      label="Add Diagnosis"
                      variant="secondary"
                      type="button"
                    />
                  </div>
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Procedures"
              icon={<Edit3 className="h-4 w-4" />}
              badge={
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {procedures.data?.length ?? 0}
                </span>
              }
              defaultOpen
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="px-2 py-2 font-medium">Procedure</th>
                      <th className="px-2 py-2 font-medium">Body Site</th>
                      <th className="px-2 py-2 font-medium">Notes</th>
                      <th className="px-2 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(procedures.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                          No procedures recorded.
                        </td>
                      </tr>
                    )}
                    {(procedures.data ?? []).map((p) => (
                      <tr key={p.id}>
                        <td className="px-2 py-2 font-medium text-gray-900 capitalize">
                          {p.procedure_type.replace(/_/g, " ")}
                        </td>
                        <td className="px-2 py-2 text-gray-600">{p.body_site || "—"}</td>
                        <td className="max-w-[150px] truncate px-2 py-2 text-gray-600">
                          {p.notes || "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                removeProcedure.mutate(p.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isActive && (
                <div className="mt-3 grid gap-2 rounded-lg bg-gray-50 p-3">
                  <div className="flex flex-wrap gap-2">
                    {PROCEDURE_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => {
                          setProcedureDraft((prev) => ({ ...prev, procedure_type: pt.value }));
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${procedureDraft.procedure_type === pt.value ? "bg-brand-600 text-white" : "hover:border-brand-300 border border-gray-200 bg-white text-gray-700"}`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="Body Site"
                      value={procedureDraft.body_site}
                      onChange={(v) => {
                        setProcedureDraft((prev) => ({ ...prev, body_site: v }));
                      }}
                    />
                    <TextField
                      label="Notes"
                      value={procedureDraft.notes}
                      onChange={(v) => {
                        setProcedureDraft((prev) => ({ ...prev, notes: v }));
                      }}
                    />
                  </div>
                  <LoadingButton
                    onClick={() => {
                      const input: ProcedureInput = {
                        procedure_type: procedureDraft.procedure_type,
                        body_site: procedureDraft.body_site || undefined,
                        notes: procedureDraft.notes || undefined,
                      };
                      void addProcedure
                        .mutateAsync({ patientId: encounter.patient_id, input })
                        .then(() => {
                          setProcedureDraft({
                            procedure_type: "cryotherapy",
                            body_site: "",
                            notes: "",
                          });
                        });
                    }}
                    loading={addProcedure.isPending}
                    icon={<Plus className="h-4 w-4" />}
                    label="Add Procedure"
                    variant="secondary"
                    type="button"
                  />
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Medications"
              icon={<Activity className="h-4 w-4" />}
              defaultOpen
            >
              <MedicationSection
                medications={encounterMeds.data ?? []}
                adding={addEncounterMed.isPending}
                onAdd={(input) => {
                  addEncounterMed.mutate(input);
                }}
                onRemove={(itemId) => {
                  removeEncounterMed.mutate(itemId);
                }}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Laboratory Reports" icon={<FileText className="h-4 w-4" />}>
              <LabReportsSection
                reports={encounterLabs.data ?? []}
                onAdd={
                  isActive
                    ? (input) => {
                        addEncounterLab.mutate(input);
                      }
                    : undefined
                }
              />
            </CollapsibleSection>

            <CollapsibleSection title="Clinical Images" icon={<Sparkles className="h-4 w-4" />}>
              <ClinicalImagesSection
                images={images}
                onAdd={(file) => {
                  setImages((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      url: URL.createObjectURL(file),
                      name: file.name,
                      uploadedAt: new Date().toISOString(),
                      bodyArea: "",
                      diagnosis: "",
                      notes: "",
                    },
                  ]);
                }}
                onRemove={(imgId) => {
                  setImages((prev) => prev.filter((i) => i.id !== imgId));
                }}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Clinical Notes" icon={<FileText className="h-4 w-4" />}>
              <ClinicalNotesSection
                notes={encounterNotes.data ?? []}
                adding={addEncounterNote.isPending}
                onAdd={
                  isActive
                    ? (input) => {
                        addEncounterNote.mutate(input);
                      }
                    : () => {}
                }
              />
            </CollapsibleSection>

            <CollapsibleSection title="Follow-up" icon={<Activity className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Follow-up Date</label>
                  <input
                    type="date"
                    value={form.follow_up_date}
                    onChange={(e) => {
                      updateForm("follow_up_date", e.target.value);
                    }}
                    disabled={!isActive}
                    className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
                <div />
                <TextAreaField
                  label="Advice"
                  value={form.follow_up_advice}
                  onChange={(v) => {
                    updateForm("follow_up_advice", v);
                  }}
                  disabled={!isActive}
                />
                <TextAreaField
                  label="Warnings"
                  value={form.follow_up_warnings}
                  onChange={(v) => {
                    updateForm("follow_up_warnings", v);
                  }}
                  disabled={!isActive}
                />
                <TextAreaField
                  label="Lifestyle Recommendations"
                  value={form.follow_up_lifestyle_advice}
                  onChange={(v) => {
                    updateForm("follow_up_lifestyle_advice", v);
                  }}
                  disabled={!isActive}
                  span="full"
                />
              </div>
            </CollapsibleSection>
          </div>

          <div className="space-y-4">
            {showAi && (
              <CollapsibleSection
                title="AI Assistant"
                icon={<Sparkles className="h-4 w-4" />}
                defaultOpen
              >
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleGenerateAISummary();
                    }}
                    disabled={aiSummaryLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {aiSummaryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    Generate AI Summary
                  </button>

                  {aiSummaryError && (
                    <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                      {aiSummaryError}
                    </div>
                  )}

                  {aiSummary && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                        <Brain className="h-3.5 w-3.5" />
                        AI-Generated Summary
                      </div>
                      <div className="prose prose-sm max-w-none text-sm text-gray-700">
                        {aiSummary.split("\n").map((line, i) => {
                          if (line.startsWith("## ")) {
                            return (
                              <h3 key={i} className="mt-3 mb-1 text-sm font-bold text-gray-900">
                                {line.replace("## ", "")}
                              </h3>
                            );
                          }
                          if (line.startsWith("- ") || line.startsWith("* ")) {
                            return (
                              <li key={i} className="ml-4 text-gray-700">
                                {line.replace(/^[-*] /, "")}
                              </li>
                            );
                          }
                          if (line.trim() === "") return <br key={i} />;
                          return (
                            <p key={i} className="text-gray-700">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-[11px] text-purple-500">
                        AI output is advisory. Review before documenting.
                      </p>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}
            <CollapsibleSection
              title="Encounter History"
              icon={<Activity className="h-4 w-4" />}
              defaultOpen
            >
              <EncounterTimeline encounters={encounters.data ?? []} />
            </CollapsibleSection>
          </div>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          title="Delete Encounter"
          message="Are you sure you want to permanently delete this encounter and all its clinical data?"
          confirmLabel="Delete"
          confirmationText="DELETE"
          loading={deleteMutation.isPending}
          onConfirm={() => {
            void handleDelete();
          }}
          onCancel={() => {
            setDeleteOpen(false);
          }}
        />
      </div>
    </AppShell>
  );
}
