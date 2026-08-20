import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PatientFormSchema,
  type PatientFormInput,
  type Medication,
  type MedicationInput,
  type ClinicalNote,
  type ClinicalNoteInput,
  type MedicalAlert,
  type AllergyInput,
  type MedicalHistoryInput,
  type LabReport,
  type LabReportInput,
} from "@domain/patient";
import { useCreateFullPatient } from "@presentation/hooks/usePatients";
import { useProfile } from "@presentation/hooks/useProfile";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import { CollapsibleSection } from "@presentation/components/CollapsibleSection";
import { PatientPersonalSection } from "@presentation/components/patient/PatientPersonalSection";
import { PatientContactSection } from "@presentation/components/patient/PatientContactSection";
import { PatientAddressSection } from "@presentation/components/patient/PatientAddressSection";
import { MedicalHistorySection } from "@presentation/components/patient/MedicalHistorySection";
import { FamilyHistorySection } from "@presentation/components/patient/FamilyHistorySection";
import { LifestyleSection } from "@presentation/components/patient/LifestyleSection";
import { DermatologySection } from "@presentation/components/patient/DermatologySection";
import { CurrentTreatmentSection } from "@presentation/components/patient/CurrentTreatmentSection";
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { MedicalAlertsSection } from "@presentation/components/patient/MedicalAlertsSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { LabReportsSection } from "@presentation/components/patient/LabReportsSection";
import { ClinicalImagesSection } from "@presentation/components/patient/ClinicalImagesSection";
import { VisitSummarySection } from "@presentation/components/patient/VisitSummarySection";
import { PatientAuditSection } from "@presentation/components/patient/PatientAuditSection";
import { SectionHeading, SummaryItem } from "@presentation/components/patient/helpers";
import {
  computeAge,
  formatDate,
  initials,
  statusBadgeClass,
  type ClinicalImage,
} from "@presentation/components/patient/utils";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  UserRound,
  Building2,
  User,
  HeartPulse,
  Stethoscope,
  FileText,
  Clock,
} from "lucide-react";

export function PatientCreatePage() {
  const navigate = useNavigate();
  const { phase, hasOrganization, selectedOrganizationId } = useResolvedOrganization();
  const { profile } = useProfile();
  const createMutation = useCreateFullPatient();
  const toast = useToast();

  const canSubmit = phase === "ready" && !createMutation.isPending;
  const defaultMrn = useMemo(() => `MRN-${Date.now()}`, []);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [images, setImages] = useState<ClinicalImage[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormInput>({
    resolver: zodResolver(PatientFormSchema),
    shouldFocusError: true,
    defaultValues: {
      mrn: defaultMrn,
      status: "active",
      first_name: "",
      last_name: "",
      dob: "",
      gender: "",
      blood_group: "",
      chronic_conditions: "",
      symptoms: "",
      primary_diagnosis: "",
    },
  });

  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const dobValue = watch("dob");
  const gender = watch("gender");
  const bloodGroup = watch("blood_group");
  const mrn = watch("mrn");
  const symptomsValue = watch("symptoms");
  const diagnosisValue = watch("primary_diagnosis");

  const age = useMemo(() => computeAge(dobValue), [dobValue]);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

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

  const doctorName = profile?.firstName
    ? `Dr. ${profile.firstName} ${profile.lastName}`
    : (profile?.email ?? "Current user");

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

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
          {/* Section 1 — Patient Summary */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start gap-4 p-6">
              <div className="bg-brand-50 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-brand-600 text-2xl font-semibold">
                  {fullName ? initials(firstName, lastName) : "NP"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{fullName || "New Patient"}</h1>
                  <span className="text-xs font-medium text-gray-500">
                    New Patient Registration
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass("active")}`}
                  >
                    active
                  </span>
                </div>
                <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryItem label="MRN" value={mrn} mono />
                  <SummaryItem label="Age" value={age !== null ? `${age} yrs` : "—"} />
                  <SummaryItem label="Gender" value={gender || "—"} />
                  <SummaryItem label="Blood Group" value={bloodGroup || "—"} />
                  <SummaryItem label="Status" value="Active" />
                  <SummaryItem
                    label="Patient ID"
                    value="Will be generated after registration"
                    truncate
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-6 py-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {createMutation.isPending ? "Saving..." : "Register Patient"}
              </button>
              <button
                type="button"
                onClick={() => void navigate("/patients")}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("ai-summary")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Sparkles className="h-4 w-4" />
                AI Summary
              </button>
              <ScopeBadge hasOrganization={hasOrganization} orgId={selectedOrganizationId} />
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {createMutation.error.message}
            </div>
          )}

          {phase === "loading" && (
            <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Loading your workspace…
            </div>
          )}

          {phase === "needs-selection" && (
            <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              You belong to multiple organizations. Select an organization to register this patient.
            </div>
          )}

          <CollapsibleSection title="Demographics" icon={<User className="h-4 w-4" />} defaultOpen>
            <div className="space-y-8">
              <PatientPersonalSection
                register={register}
                errors={errors}
                age={age}
                showStatus={false}
              />
              <PatientAddressSection
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
              <PatientContactSection register={register} errors={errors} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Medical History" icon={<HeartPulse className="h-4 w-4" />}>
            <div className="space-y-8">
              <MedicalHistorySection register={register} errors={errors} />
              <FamilyHistorySection register={register} />
              <LifestyleSection register={register} gender={gender} />
              <MedicalAlertsSection
                register={register}
                errors={errors}
                alerts={[]}
                pendingAlerts={alerts}
                chronicConditions={watch("chronic_conditions") ?? ""}
                onAddAlert={(alert) => {
                  setAlerts((prev) => [...prev, alert]);
                }}
                onRemoveAlert={(id) => {
                  setAlerts((prev) => prev.filter((a) => a.id !== id));
                }}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Dermatology" icon={<Stethoscope className="h-4 w-4" />}>
            <div className="space-y-8">
              <DermatologySection
                register={register}
                errors={errors}
                symptoms={symptomsValue}
                onSymptomsChange={(value) => {
                  setValue("symptoms", value, { shouldValidate: true });
                }}
              />
              <CurrentTreatmentSection
                register={register}
                errors={errors}
                currentDiagnosis={diagnosisValue}
                prescriptionAvailable={medications.length > 0}
                reportGenerated={reports.length > 0}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Clinical Records" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-8">
              <MedicationSection
                medications={medications}
                adding={false}
                onAdd={(input) => {
                  setMedications((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      prescription_id: crypto.randomUUID(),
                      medication_name: input.medication_name,
                      dosage: input.dosage ?? "",
                      frequency: input.frequency ?? "",
                      duration: input.duration ?? null,
                      start_date: input.start_date ?? null,
                      end_date: input.end_date ?? null,
                      prescribing_doctor: input.prescribing_doctor ?? null,
                      instructions: null,
                    },
                  ]);
                }}
                onRemove={(id) => {
                  setMedications((prev) => prev.filter((m) => m.id !== id));
                }}
              />
              <LabReportsSection
                reports={reports}
                onAdd={(input) => {
                  setReports((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      test_name: input.test_name,
                      status: "ordered",
                      report_date: null,
                      result_summary: null,
                      lab_name: null,
                    },
                  ]);
                }}
                onRemove={(id) => {
                  setReports((prev) => prev.filter((r) => r.id !== id));
                }}
              />
              <ClinicalNotesSection
                notes={notes}
                adding={false}
                onAdd={(input) => {
                  setNotes((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      note_type: input.note_type ?? "soap",
                      subjective: input.subjective ?? null,
                      objective: input.objective ?? null,
                      assessment: input.assessment ?? null,
                      plan: input.plan ?? null,
                      created_by: "",
                      created_at: new Date().toISOString(),
                    },
                  ]);
                }}
              />
              <ClinicalImagesSection
                images={images}
                onAdd={(img) => {
                  setImages((prev) => [...prev, img]);
                }}
                onRemove={(id) => {
                  setImages((prev) => prev.filter((x) => x.id !== id));
                }}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Summary" icon={<Clock className="h-4 w-4" />}>
            <div className="space-y-8">
              <VisitSummarySection
                lastVisitDate={null}
                nextFollowUpDate={null}
                totalVisits={0}
                assignedDoctor={doctorName}
              />

              <div id="ai-summary" className="space-y-3">
                <SectionHeading icon={<Sparkles className="h-4 w-4" />} title="AI Summary" />
                <div className="border-brand-100 bg-brand-50/40 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-gray-900">Clinical Summary</h3>
                  <p className="mt-2 text-sm text-gray-600">No clinical data available yet.</p>
                  <p className="mt-1 text-xs text-gray-400">
                    After patient creation, future visits will populate this section automatically.
                  </p>
                </div>
              </div>

              <PatientAuditSection
                createdBy={doctorName}
                createdAt={formatDate(new Date().toISOString())}
                updatedAt={formatDate(new Date().toISOString())}
                updatedBy="—"
                organization={
                  hasOrganization ? (selectedOrganizationId ?? "Organization") : "Personal record"
                }
              />
            </div>
          </CollapsibleSection>
        </form>
      </div>
    </AppShell>
  );
}

function ScopeBadge({
  hasOrganization,
  orgId,
}: {
  hasOrganization: boolean;
  orgId: string | null;
}) {
  if (hasOrganization) {
    return (
      <span className="bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
        <Building2 className="h-3.5 w-3.5" />
        Organization record
      </span>
    );
  }
  return (
    <span
      className="bg-surface-100 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-gray-700"
      title={orgId === null ? "Saved with created_by = auth.uid() only" : "Pending selection"}
    >
      <UserRound className="h-3.5 w-3.5" />
      Personal record
    </span>
  );
}
