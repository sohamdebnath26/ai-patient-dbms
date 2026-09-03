import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateFullPatient } from "@presentation/hooks/usePatients";
import { useProfile } from "@presentation/hooks/useProfile";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { useToast } from "@presentation/hooks/useToast";
import { PatientFormSchema, type PatientFormInput } from "@domain/patient";
import type {
  MedicationInput,
  ClinicalNoteInput,
  LabReportInput,
  AllergyInput,
  MedicalHistoryInput,
  ClinicalNote,
  Medication,
  LabReport,
  MedicalAlert,
} from "@domain/patient";
import { AppShell } from "@presentation/components/AppShell";
import { CollapsibleSection } from "@presentation/components/CollapsibleSection";
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { LabReportsSection } from "@presentation/components/patient/LabReportsSection";
import { ClinicalImagesSection } from "@presentation/components/patient/ClinicalImagesSection";
import { MedicalAlertsSection } from "@presentation/components/patient/MedicalAlertsSection";
import { PatientPersonalSection } from "@presentation/components/patient/PatientPersonalSection";
import { PatientAddressSection } from "@presentation/components/patient/PatientAddressSection";
import { PatientContactSection } from "@presentation/components/patient/PatientContactSection";
import { MedicalHistorySection } from "@presentation/components/patient/MedicalHistorySection";
import { FamilyHistorySection } from "@presentation/components/patient/FamilyHistorySection";
import { LifestyleSection } from "@presentation/components/patient/LifestyleSection";
import { DermatologySection } from "@presentation/components/patient/DermatologySection";
import { CurrentTreatmentSection } from "@presentation/components/patient/CurrentTreatmentSection";
import { VisitSummarySection } from "@presentation/components/patient/VisitSummarySection";
import { computeAge, type ClinicalImage } from "@presentation/components/patient/utils";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  User,
  Phone as PhoneIcon,
  Stethoscope,
  Heart,
  Pill,
  ClipboardList,
  CheckCircle2,
  Activity,
} from "lucide-react";

type Step = "identity" | "medical" | "clinical";

interface StepConfig {
  key: Step;
  label: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  { key: "identity", label: "Identity & Contact", icon: <User className="h-4 w-4" /> },
  { key: "medical", label: "Medical Background", icon: <Heart className="h-4 w-4" /> },
  { key: "clinical", label: "Clinical & Treatment", icon: <ClipboardList className="h-4 w-4" /> },
];

export function PatientCreatePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { phase } = useResolvedOrganization();
  const toast = useToast();
  const createMutation = useCreateFullPatient();
  const [step, setStep] = useState<Step>("identity");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormInput>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      dob: "",
      gender: "",
      blood_group: "",
      mrn: `MRN-${Date.now()}`,
      status: "active",
      symptoms: "",
      primary_diagnosis: "",
      chronic_conditions: "",
    },
    shouldFocusError: true,
  });

  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [images, setImages] = useState<ClinicalImage[]>([]);

  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const dob = watch("dob");
  const gender = watch("gender");
  const bloodGroup = watch("blood_group");
  const mrn = watch("mrn");
  const symptoms = watch("symptoms");
  const diagnosis = watch("primary_diagnosis");
  const chronicConditions = watch("chronic_conditions");

  const age = useMemo(() => (dob ? computeAge(dob) : null), [dob]);

  const headerData: PatientHeaderData = {
    firstName,
    lastName,
    dob,
    gender,
    bloodGroup,
    mrn,
    status: "active",
  };

  const canSubmit = phase === "ready" && !createMutation.isPending;

  function onSubmit(data: PatientFormInput) {
    if (!canSubmit) return;

    const medicationInputs: MedicationInput[] = medications.map((m) => ({
      medication_name: m.medication_name,
      dosage: m.dosage || undefined,
      frequency: m.frequency || undefined,
      duration: m.duration ?? undefined,
      start_date: m.start_date ?? undefined,
      end_date: m.end_date ?? undefined,
      prescribing_doctor: m.prescribing_doctor ?? undefined,
    }));

    const noteInputs: ClinicalNoteInput[] = notes.map((n) => ({
      note_type: n.note_type,
      subjective: n.subjective ?? undefined,
      objective: n.objective ?? undefined,
      assessment: n.assessment ?? undefined,
      plan: n.plan ?? undefined,
    }));

    const allergyInputs: AllergyInput[] = [];
    const historyInputs: MedicalHistoryInput[] = [];
    for (const alert of alerts) {
      if (alert.category === "allergy") {
        allergyInputs.push({ allergen: alert.label, severity: alert.severity });
      } else {
        historyInputs.push({
          condition: alert.label,
          status: alert.severity === "chronic" ? "chronic" : "active",
        });
      }
    }

    const reportInputs: LabReportInput[] = reports.map((r) => ({ test_name: r.test_name }));

    void createMutation.mutateAsync(
      {
        input: data,
        medications: medicationInputs,
        notes: noteInputs,
        allergies: allergyInputs,
        medicalHistory: historyInputs,
        labReports: reportInputs,
      },
      {
        onSuccess: (patient) => {
          toast.success("Patient registered successfully.");
          void navigate(`/patients/${patient.id}`);
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Registration failed. Please try again.";
          toast.error(message);
          setValue("mrn", `MRN-${Date.now()}`, { shouldDirty: true });
        },
      },
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <button
          type="button"
          onClick={() => {
            void navigate("/patients");
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </button>

        <PatientHeader
          patient={headerData}
          heading="New Patient Registration"
          subtitle={`Registering as ${profile?.role ?? "..."}`}
        />

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                if (i < currentStepIdx) setStep(s.key);
              }}
              disabled={i > currentStepIdx}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                i === currentStepIdx
                  ? "bg-brand-600 text-white shadow-sm"
                  : i < currentStepIdx
                    ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "cursor-not-allowed text-gray-400"
              }`}
            >
              {i < currentStepIdx ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {phase === "loading" && (
          <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Loading your workspace&hellip;
          </div>
        )}
        {phase === "needs-selection" && (
          <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            You belong to multiple organizations. Select an organization to register this patient.
          </div>
        )}

        {createMutation.isError && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {createMutation.error.message}
          </div>
        )}

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {step === "identity" && (
              <>
                <CollapsibleSection
                  title="Personal Information"
                  icon={<User className="h-4 w-4" />}
                  defaultOpen
                >
                  <PatientPersonalSection
                    register={register}
                    errors={errors}
                    age={age}
                    showStatus={false}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Address"
                  icon={<PhoneIcon className="h-4 w-4" />}
                  defaultOpen
                >
                  <div className="space-y-8">
                    <PatientAddressSection
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      watch={watch}
                    />
                    <div className="border-t border-gray-100 pt-6">
                      <PatientContactSection register={register} errors={errors} />
                    </div>
                  </div>
                </CollapsibleSection>
              </>
            )}

            {step === "medical" && (
              <>
                <CollapsibleSection
                  title="Medical History"
                  icon={<Stethoscope className="h-4 w-4" />}
                  defaultOpen
                >
                  <div className="space-y-8">
                    <MedicalHistorySection register={register} errors={errors} />
                    <FamilyHistorySection register={register} />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Alerts & Conditions"
                  icon={<Activity className="h-4 w-4" />}
                  defaultOpen
                >
                  <MedicalAlertsSection
                    register={register}
                    errors={errors}
                    alerts={[]}
                    pendingAlerts={alerts}
                    chronicConditions={chronicConditions}
                    onAddAlert={(a) => {
                      setAlerts((prev) => [...prev, a]);
                    }}
                    onRemoveAlert={(id) => {
                      setAlerts((prev) => prev.filter((p) => p.id !== id));
                    }}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Lifestyle"
                  icon={<Heart className="h-4 w-4" />}
                  defaultOpen
                >
                  <LifestyleSection register={register} gender={gender} />
                </CollapsibleSection>
              </>
            )}

            {step === "clinical" && (
              <>
                <CollapsibleSection
                  title="Dermatology Profile"
                  icon={<Activity className="h-4 w-4" />}
                  defaultOpen
                >
                  <DermatologySection
                    register={register}
                    errors={errors}
                    symptoms={symptoms}
                    onSymptomsChange={(v) => {
                      setValue("symptoms", v);
                    }}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Current Treatment"
                  icon={<Pill className="h-4 w-4" />}
                  defaultOpen
                >
                  <CurrentTreatmentSection
                    register={register}
                    errors={errors}
                    currentDiagnosis={diagnosis}
                    prescriptionAvailable={medications.length > 0}
                    reportGenerated={reports.length > 0}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Medications"
                  icon={<Pill className="h-4 w-4" />}
                  defaultOpen
                >
                  <MedicationSection
                    medications={medications}
                    adding={false}
                    onAdd={(input) => {
                      setMedications((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          ...input,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          patient_id: "",
                          created_by: "",
                        } as Medication,
                      ]);
                    }}
                    onRemove={(id) => {
                      setMedications((prev) => prev.filter((m) => m.id !== id));
                    }}
                  />
                </CollapsibleSection>

                <CollapsibleSection title="Lab Reports" icon={<Activity className="h-4 w-4" />}>
                  <LabReportsSection
                    reports={reports}
                    onAdd={(input) => {
                      setReports((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          ...input,
                          status: "ordered",
                          patient_id: "",
                          created_by: "",
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        } as LabReport,
                      ]);
                    }}
                    onRemove={(id) => {
                      setReports((prev) => prev.filter((r) => r.id !== id));
                    }}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Clinical Notes"
                  icon={<ClipboardList className="h-4 w-4" />}
                >
                  <ClinicalNotesSection
                    notes={notes}
                    adding={false}
                    onAdd={(input) => {
                      setNotes((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          ...input,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          patient_id: "",
                          created_by: "",
                          note_type: input.note_type || "general",
                        } as ClinicalNote,
                      ]);
                    }}
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
                    onRemove={(id) => {
                      setImages((prev) => prev.filter((img) => img.id !== id));
                    }}
                  />
                </CollapsibleSection>

                <CollapsibleSection title="Visit Summary" icon={<Activity className="h-4 w-4" />}>
                  <VisitSummarySection
                    lastVisitDate={null}
                    nextFollowUpDate={null}
                    totalVisits={0}
                    assignedDoctor={
                      profile?.firstName
                        ? `Dr. ${profile.firstName} ${profile.lastName}`
                        : "Not assigned"
                    }
                  />
                </CollapsibleSection>
              </>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">
              Step {currentStepIdx + 1} of {STEPS.length} &middot; {STEPS[currentStepIdx]?.label}
            </div>
            <div className="flex gap-2">
              {currentStepIdx > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(STEPS[currentStepIdx - 1].key);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {currentStepIdx < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep(STEPS[currentStepIdx + 1].key);
                  }}
                  className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {createMutation.isPending ? "Saving..." : "Register Patient"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
