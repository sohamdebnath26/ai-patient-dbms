import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditPatientFormSchema,
  type EditPatientFormInput,
  type UpdatePatientInput,
} from "@domain/patient";
import {
  usePatient,
  useUpdatePatient,
  useDeregisterPatient,
} from "@presentation/hooks/usePatients";
import {
  usePatientClinicalData,
  useAddMedication,
  useRemoveMedication,
  useAddClinicalNote,
} from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { CollapsibleSection } from "@presentation/components/CollapsibleSection";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import { PatientPersonalSection } from "@presentation/components/patient/PatientPersonalSection";
import { PatientContactSection } from "@presentation/components/patient/PatientContactSection";
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
import {
  AiSummaryBlock,
  SectionHeading,
  SummaryItem,
} from "@presentation/components/patient/helpers";
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
  Save,
  UserRoundX,
  Clock,
  RefreshCw,
  User,
  HeartPulse,
  Stethoscope,
  FileText,
} from "lucide-react";

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const updateMutation = useUpdatePatient();
  const deregisterMutation = useDeregisterPatient();
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const addMedication = useAddMedication(id ?? "");
  const removeMedication = useRemoveMedication(id ?? "");
  const addNote = useAddClinicalNote(id ?? "");

  const isReceptionist = profile?.role === "receptionist";
  const [deregisterOpen, setDeregisterOpen] = useState(false);
  const [images, setImages] = useState<ClinicalImage[]>([]);
  const [aiSummaryAt, setAiSummaryAt] = useState<Date>(new Date());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditPatientFormInput>({
    resolver: zodResolver(EditPatientFormSchema),
    defaultValues: {
      gender: "",
      symptoms: "",
      primary_diagnosis: "",
    },
  });

  const dobValue = watch("dob");

  useEffect(() => {
    if (patient) {
      reset({
        first_name: patient.first_name,
        last_name: patient.last_name,
        dob: patient.dob ?? "",
        gender: patient.gender ?? "",
        blood_group: patient.blood_group ?? "",
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        mrn: patient.mrn,
        status: patient.status,
        address_line1: patient.address_line1 ?? patient.address ?? "",
        address_line2: patient.address_line2 ?? "",
        city: patient.city ?? "",
        state: patient.state ?? "",
        country: patient.country ?? "",
        postal_code: patient.postal_code ?? "",
        emergency_contact_name: patient.emergency_contact_name ?? "",
        emergency_contact_phone: patient.emergency_contact_phone ?? "",
        emergency_contact_relationship: patient.emergency_contact_relationship ?? "",
        chronic_conditions: patient.chronic_conditions ?? "",
        primary_diagnosis: patient.primary_diagnosis ?? "",
        secondary_diagnosis: patient.secondary_diagnosis ?? "",
        skin_type: patient.skin_type ?? "",
        affected_body_areas: patient.affected_body_areas ?? "",
        disease_severity: patient.disease_severity ?? "",
        duration: patient.duration ?? "",
        current_flare: patient.current_flare ?? false,
        previous_skin_cancer: patient.previous_skin_cancer ?? false,
        current_treatment: patient.current_treatment ?? "",
        medical_notes: patient.medical_notes ?? "",
        chief_complaint: patient.chief_complaint ?? "",
        present_illness: patient.present_illness ?? "",
        previous_skin_diseases: patient.previous_skin_diseases ?? "",
        previous_surgeries: patient.previous_surgeries ?? "",
        other_medical_conditions: patient.other_medical_conditions ?? "",
        family_history_skin: patient.family_history_skin ?? "",
        family_history_cancer: patient.family_history_cancer ?? "",
        smoking_status: patient.smoking_status ?? "",
        alcohol_consumption: patient.alcohol_consumption ?? "",
        pregnancy_status: patient.pregnancy_status ?? "",
        date_of_onset: patient.date_of_onset ?? "",
        symptoms: patient.symptoms ?? "",
        sun_exposure_history: patient.sun_exposure_history ?? "",
        cosmetic_product_usage: patient.cosmetic_product_usage ?? "",
        occupational_exposure: patient.occupational_exposure ?? "",
      });
    }
  }, [patient, reset]);

  const age = useMemo(() => computeAge(dobValue), [dobValue]);

  const symptomsValue = watch("symptoms");
  const genderValue = watch("gender");
  const diagnosisValue = watch("primary_diagnosis");

  const prescriptionAvailable = (clinical?.medications.length ?? 0) > 0;
  const reportGenerated = (clinical?.labReports.length ?? 0) > 0;
  const assignedDoctor = profile?.firstName ? `Dr. ${profile.firstName} ${profile.lastName}` : "—";

  const appointments = useMemo(() => clinical?.appointments ?? [], [clinical?.appointments]);
  const lastVisit = useMemo(() => {
    const completed = appointments.filter((a) => a.status === "completed");
    const latest = [...appointments].sort((a, b) =>
      b.appointment_date.localeCompare(a.appointment_date),
    )[0];
    return completed[0] ?? latest ?? null;
  }, [appointments]);

  const upcomingAppointment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.find((a) => a.appointment_date >= today) ?? null;
  }, [appointments]);

  const totalVisits = appointments.filter((a) => a.status === "completed").length;

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

  function onSubmit(data: EditPatientFormInput) {
    if (!id) return;
    const payload: UpdatePatientInput = isReceptionist
      ? {
          first_name: data.first_name,
          last_name: data.last_name,
          dob: data.dob,
          gender: data.gender,
          blood_group: data.blood_group,
          email: data.email,
          phone: data.phone,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          city: data.city,
          state: data.state,
          country: data.country,
          postal_code: data.postal_code,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          emergency_contact_relationship: data.emergency_contact_relationship,
        }
      : data;

    updateMutation.mutate(
      { id, input: payload },
      { onSuccess: () => void navigate(`/patients/${id}`) },
    );
  }

  const summaryAge = computeAge(patient.dob);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <button
          onClick={() => void navigate(`/patients/${id}`)}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient
        </button>

        {isReceptionist && (
          <div className="rounded-md bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
            As a receptionist, you can only edit demographic information.
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
          {/* Section 1 — Patient Summary */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start gap-4 p-6">
              <div className="bg-brand-50 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-brand-600 text-2xl font-semibold">
                  {initials(patient.first_name, patient.last_name)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(patient.status)}`}
                  >
                    {patient.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryItem label="MRN" value={patient.mrn} mono />
                  <SummaryItem
                    label="Age"
                    value={summaryAge !== null ? `${summaryAge} yrs` : "—"}
                  />
                  <SummaryItem label="Gender" value={patient.gender ?? "—"} />
                  <SummaryItem label="Blood Group" value={patient.blood_group ?? "—"} />
                  <SummaryItem label="Registration Date" value={formatDate(patient.created_at)} />
                  <SummaryItem label="Last Visit" value={formatDate(lastVisit?.appointment_date)} />
                  <SummaryItem
                    label="Assigned Doctor"
                    value={
                      profile?.firstName ? `Dr. ${profile.firstName} ${profile.lastName}` : "—"
                    }
                  />
                  <SummaryItem label="Patient ID" value={patient.id} mono truncate />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-6 py-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => void navigate(`/patients/${id}`)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {patient.status !== "deregistered" && profile?.role === "doctor" && (
                <button
                  type="button"
                  onClick={() => {
                    setDeregisterOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-orange-200 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50"
                >
                  <UserRoundX className="h-4 w-4" />
                  Deregister Patient
                </button>
              )}
              <button
                type="button"
                onClick={() => void navigate(`/patients/${id}`)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Clock className="h-4 w-4" />
                View Timeline
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
            </div>
          </div>

          {updateMutation.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {updateMutation.error.message}
            </div>
          )}

          <CollapsibleSection title="Demographics" icon={<User className="h-4 w-4" />} defaultOpen>
            <div className="space-y-8">
              <PatientPersonalSection
                register={register}
                errors={errors}
                age={age}
                statusDisabled={isReceptionist}
              />
              <PatientContactSection register={register} errors={errors} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Medical History" icon={<HeartPulse className="h-4 w-4" />}>
            <div className="space-y-8">
              <MedicalHistorySection register={register} errors={errors} />
              <FamilyHistorySection register={register} />
              <LifestyleSection register={register} gender={genderValue} />
              <MedicalAlertsSection
                register={register}
                errors={errors}
                alerts={clinical?.alerts ?? []}
                pendingAlerts={[]}
                chronicConditions={patient.chronic_conditions ?? ""}
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
                prescriptionAvailable={prescriptionAvailable}
                reportGenerated={reportGenerated}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Clinical Records" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-8">
              <MedicationSection
                medications={clinical?.medications ?? []}
                adding={addMedication.isPending}
                onAdd={(input) => {
                  addMedication.mutate(input);
                }}
                onRemove={(id) => {
                  removeMedication.mutate(id);
                }}
              />
              <LabReportsSection reports={clinical?.labReports ?? []} />
              <ClinicalNotesSection
                notes={clinical?.clinicalNotes ?? []}
                adding={addNote.isPending}
                onAdd={(input) => {
                  addNote.mutate(input);
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
                lastVisitDate={lastVisit?.appointment_date ?? null}
                nextFollowUpDate={upcomingAppointment?.appointment_date ?? null}
                totalVisits={totalVisits}
                assignedDoctor={assignedDoctor}
              />

              <div id="ai-summary" className="space-y-3">
                <SectionHeading icon={<Sparkles className="h-4 w-4" />} title="AI Summary" />
                <div className="border-brand-100 bg-brand-50/40 rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Clinical Summary</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAiSummaryAt(new Date());
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate Summary
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Generated {aiSummaryAt.toLocaleTimeString()}
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-gray-700">
                    <AiSummaryBlock
                      label="Patient Summary"
                      value={`${patient.first_name} ${patient.last_name}, ${summaryAge !== null ? `${summaryAge}-year-old` : "age unknown"} ${patient.gender?.toLowerCase() ?? "patient"}. Primary diagnosis: ${patient.primary_diagnosis || "none recorded"}.`}
                    />
                    <AiSummaryBlock
                      label="Disease Progression"
                      value={
                        [
                          patient.disease_severity ? `Severity: ${patient.disease_severity}` : null,
                          patient.duration ? `Duration: ${patient.duration}` : null,
                          patient.current_flare ? "Currently in flare" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No progression data recorded."
                      }
                    />
                    <AiSummaryBlock
                      label="Important Alerts"
                      value={
                        (clinical?.alerts ?? []).map((a) => a.label).join(", ") ||
                        "No active alerts."
                      }
                    />
                    <AiSummaryBlock
                      label="Medication Summary"
                      value={
                        (clinical?.medications ?? []).map((m) => m.medication_name).join(", ") ||
                        "No active medications."
                      }
                    />
                    <AiSummaryBlock
                      label="Upcoming Follow-up"
                      value={
                        upcomingAppointment
                          ? `${formatDate(upcomingAppointment.appointment_date)} (${upcomingAppointment.type})`
                          : "No upcoming appointment scheduled."
                      }
                    />
                    <AiSummaryBlock
                      label="Recent Diagnosis"
                      value={patient.primary_diagnosis ?? "None recorded."}
                    />
                    <AiSummaryBlock
                      label="AI Recommendations"
                      value="Review disease severity and current treatment at the next visit. Consider a follow-up skin examination and continue monitoring affected body areas."
                    />
                  </div>
                </div>
              </div>

              <PatientAuditSection
                createdBy={patient.created_by}
                createdAt={formatDate(patient.created_at)}
                updatedAt={formatDate(patient.updated_at)}
                updatedBy="—"
              />
            </div>
          </CollapsibleSection>
        </form>
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
              void navigate(`/patients/${id}`);
            },
          });
        }}
      />
    </AppShell>
  );
}
