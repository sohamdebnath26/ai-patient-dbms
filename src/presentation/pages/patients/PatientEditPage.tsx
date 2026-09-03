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
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
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
import { computeAge, type ClinicalImage } from "@presentation/components/patient/utils";
import {
  ArrowLeft,
  Loader2,
  Save,
  UserRoundX,
  User,
  HeartPulse,
  Stethoscope,
  Activity,
  Pill,
  ClipboardList,
  Sparkles,
  Clock,
} from "lucide-react";

type EditTab = "overview" | "demographics" | "medical" | "clinical";

const TABS: { key: EditTab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <HeartPulse className="h-4 w-4" /> },
  { key: "demographics", label: "Demographics", icon: <User className="h-4 w-4" /> },
  { key: "medical", label: "History & Lifestyle", icon: <Stethoscope className="h-4 w-4" /> },
  { key: "clinical", label: "Clinical Record", icon: <ClipboardList className="h-4 w-4" /> },
];

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
  const [activeTab, setActiveTab] = useState<EditTab>("overview");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditPatientFormInput>({
    resolver: zodResolver(EditPatientFormSchema),
    defaultValues: { gender: "", symptoms: "", primary_diagnosis: "" },
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
        landmark: patient.landmark ?? "",
        city: patient.city ?? "",
        district: patient.district ?? "",
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

  const appointmentList = useMemo(() => clinical?.appointments ?? [], [clinical?.appointments]);
  const lastVisit = useMemo(() => {
    const latest = [...appointmentList].sort((a, b) =>
      b.appointment_date.localeCompare(a.appointment_date),
    )[0];
    return latest ?? null;
  }, [appointmentList]);
  const totalVisits = appointmentList.filter((a) => a.status === "completed").length;
  const upcomingAppointment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointmentList.find((a) => a.appointment_date >= today) ?? null;
  }, [appointmentList]);
  const assignedDoctor = profile?.firstName ? `Dr. ${profile.firstName} ${profile.lastName}` : "—";

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
          landmark: data.landmark,
          city: data.city,
          district: data.district,
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
      {
        onSuccess: () => {
          void navigate(`/patients/${id}`);
        },
      },
    );
  }

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

  const allergyList = (clinical?.alerts ?? [])
    .filter((a) => a.category === "allergy")
    .map((a) => a.label);

  const medList = (clinical?.medications ?? []).map((m) => m.medication_name);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <button
          type="button"
          onClick={() => {
            void navigate(`/patients/${id}`);
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patient
        </button>

        {isReceptionist && (
          <div className="rounded-md bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
            As a receptionist, you can only edit demographic information.
          </div>
        )}

        <PatientHeader
          patient={headerData}
          showId
          allergies={allergyList}
          activeMedications={medList}
          previousSkinCancer={patient.previous_skin_cancer ?? false}
          lastVisit={lastVisit?.appointment_date ?? null}
          nextFollowUp={upcomingAppointment?.appointment_date ?? null}
        >
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="edit-patient-form"
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
            {patient.status !== "deregistered" && profile?.role === "doctor" && (
              <button
                type="button"
                onClick={() => {
                  setDeregisterOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <UserRoundX className="h-4 w-4" /> Deregister
              </button>
            )}
          </div>
        </PatientHeader>

        {updateMutation.isError && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {updateMutation.error.message}
          </div>
        )}

        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {activeTab === "overview" && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <CollapsibleSection
                  title="Current Condition"
                  icon={<Activity className="h-4 w-4" />}
                  defaultOpen
                >
                  <CurrentTreatmentSection
                    register={register}
                    errors={errors}
                    currentDiagnosis={diagnosisValue}
                    prescriptionAvailable={(clinical?.medications.length ?? 0) > 0}
                    reportGenerated={(clinical?.labReports.length ?? 0) > 0}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Visit Summary"
                  icon={<Clock className="h-4 w-4" />}
                  defaultOpen
                >
                  <VisitSummarySection
                    lastVisitDate={lastVisit?.appointment_date ?? null}
                    nextFollowUpDate={upcomingAppointment?.appointment_date ?? null}
                    totalVisits={totalVisits}
                    assignedDoctor={assignedDoctor}
                  />
                </CollapsibleSection>
              </div>

              <CollapsibleSection
                title="Medical Alerts"
                icon={<Activity className="h-4 w-4" />}
                defaultOpen
              >
                <MedicalAlertsSection
                  register={register}
                  errors={errors}
                  alerts={clinical?.alerts ?? []}
                  pendingAlerts={[]}
                  chronicConditions={patient.chronic_conditions ?? ""}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Clinical Data"
                icon={<ClipboardList className="h-4 w-4" />}
                defaultOpen
              >
                <div className="space-y-6">
                  <MedicationSection
                    medications={clinical?.medications ?? []}
                    adding={addMedication.isPending}
                    onAdd={(input) => {
                      addMedication.mutate(input);
                    }}
                    onRemove={(itemId) => {
                      removeMedication.mutate(itemId);
                    }}
                  />
                  <div className="border-t border-gray-100 pt-6">
                    <LabReportsSection reports={clinical?.labReports ?? []} />
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <ClinicalNotesSection
                      notes={clinical?.clinicalNotes ?? []}
                      adding={addNote.isPending}
                      onAdd={(input) => {
                        addNote.mutate(input);
                      }}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Images" icon={<Sparkles className="h-4 w-4" />}>
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
            </>
          )}

          {activeTab === "demographics" && (
            <>
              <CollapsibleSection
                title="Personal Information"
                icon={<User className="h-4 w-4" />}
                defaultOpen
              >
                <PatientPersonalSection register={register} errors={errors} age={age} />
              </CollapsibleSection>
              <CollapsibleSection title="Address" icon={<User className="h-4 w-4" />} defaultOpen>
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

          {activeTab === "medical" && (
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
                title="Lifestyle"
                icon={<HeartPulse className="h-4 w-4" />}
                defaultOpen
              >
                <LifestyleSection register={register} gender={genderValue} />
              </CollapsibleSection>
              <CollapsibleSection
                title="Dermatology Profile"
                icon={<Activity className="h-4 w-4" />}
                defaultOpen
              >
                <DermatologySection
                  register={register}
                  errors={errors}
                  symptoms={symptomsValue}
                  onSymptomsChange={(v) => {
                    setValue("symptoms", v);
                  }}
                />
              </CollapsibleSection>
            </>
          )}

          {activeTab === "clinical" && (
            <>
              <CollapsibleSection
                title="Treatment & Diagnosis"
                icon={<Pill className="h-4 w-4" />}
                defaultOpen
              >
                <CurrentTreatmentSection
                  register={register}
                  errors={errors}
                  currentDiagnosis={diagnosisValue}
                  prescriptionAvailable={(clinical?.medications.length ?? 0) > 0}
                  reportGenerated={(clinical?.labReports.length ?? 0) > 0}
                />
              </CollapsibleSection>
              <CollapsibleSection
                title="Dermatology"
                icon={<Activity className="h-4 w-4" />}
                defaultOpen
              >
                <DermatologySection
                  register={register}
                  errors={errors}
                  symptoms={symptomsValue}
                  onSymptomsChange={(v) => {
                    setValue("symptoms", v);
                  }}
                />
              </CollapsibleSection>
              <CollapsibleSection
                title="Medications"
                icon={<Pill className="h-4 w-4" />}
                defaultOpen
              >
                <MedicationSection
                  medications={clinical?.medications ?? []}
                  adding={addMedication.isPending}
                  onAdd={(input) => {
                    addMedication.mutate(input);
                  }}
                  onRemove={(itemId) => {
                    removeMedication.mutate(itemId);
                  }}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Lab Reports" icon={<Activity className="h-4 w-4" />}>
                <LabReportsSection reports={clinical?.labReports ?? []} />
              </CollapsibleSection>
              <CollapsibleSection
                title="Clinical Notes"
                icon={<ClipboardList className="h-4 w-4" />}
              >
                <ClinicalNotesSection
                  notes={clinical?.clinicalNotes ?? []}
                  adding={addNote.isPending}
                  onAdd={(input) => {
                    addNote.mutate(input);
                  }}
                />
              </CollapsibleSection>
            </>
          )}
        </form>

        <CollapsibleSection title="Audit" icon={<Clock className="h-4 w-4" />}>
          <PatientAuditSection
            createdBy={patient.created_by}
            createdAt={patient.created_at}
            updatedAt={patient.updated_at}
            updatedBy="—"
          />
        </CollapsibleSection>

        <ConfirmDialog
          open={deregisterOpen}
          title="Deregister Patient"
          message={`Are you sure you want to deregister ${patient.first_name} ${patient.last_name}? They will be removed from active views but historical records will be preserved.`}
          confirmLabel="Deregister"
          confirmationText="DEREGISTER"
          loading={deregisterMutation.isPending}
          onConfirm={() => {
            deregisterMutation.mutate(patient.id, {
              onSuccess: () => {
                setDeregisterOpen(false);
                void navigate(`/patients/${id}`);
              },
            });
          }}
          onCancel={() => {
            setDeregisterOpen(false);
          }}
        />
      </div>
    </AppShell>
  );
}
