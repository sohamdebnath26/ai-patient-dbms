import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm, FormProvider, type FieldErrors } from "react-hook-form";
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
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
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
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { MedicalAlertsSection } from "@presentation/components/patient/MedicalAlertsSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { computeAge } from "@presentation/components/patient/utils";
import { SupabaseMedicationSuggestionService } from "@infrastructure/supabase/medication/SupabaseMedicationSuggestionService";
import {
  ArrowLeft,
  Loader2,
  Save,
  UserRoundX,
  User,
  HeartPulse,
  Activity,
  Pill,
  Sparkles,
  Sun,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Patient Overview" },
  { key: "medical-history", label: "Medical History" },
  { key: "dermatology", label: "Dermatology" },
  { key: "medications", label: "Medications" },
  { key: "alerts", label: "Alerts & Notes" },
  { key: "lifestyle", label: "Lifestyle" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FIELD_TAB_MAP: Record<string, { tab: TabKey; label: string }> = {
  first_name: { tab: "overview", label: "First Name" },
  last_name: { tab: "overview", label: "Last Name" },
  dob: { tab: "overview", label: "Date of Birth" },
  gender: { tab: "overview", label: "Gender" },
  mrn: { tab: "overview", label: "MRN" },
  phone: { tab: "overview", label: "Phone" },
  address_line1: { tab: "overview", label: "Address Line 1" },
  city: { tab: "overview", label: "City" },
  state: { tab: "overview", label: "State" },
  country: { tab: "overview", label: "Country" },
  postal_code: { tab: "overview", label: "Postal Code" },
  chief_complaint: { tab: "medical-history", label: "Chief Complaint" },
  present_illness: { tab: "medical-history", label: "Present Illness" },
  primary_diagnosis: { tab: "dermatology", label: "Primary Diagnosis" },
  current_treatment: { tab: "dermatology", label: "Current Treatment" },
  date_of_onset: { tab: "dermatology", label: "Date of Onset" },
  symptoms: { tab: "dermatology", label: "Symptoms" },
};

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
  const toast = useToast();

  const isReceptionist = profile?.role === "receptionist";
  const [deregisterOpen, setDeregisterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [validationBanner, setValidationBanner] = useState<string[] | null>(null);

  const methods = useForm<EditPatientFormInput>({
    resolver: zodResolver(EditPatientFormSchema),
    defaultValues: { gender: "", symptoms: "", primary_diagnosis: "" },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const dobValue = watch("dob");
  const genderValue = watch("gender");
  const primaryDiagnosisValue = watch("primary_diagnosis");

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

  useEffect(() => {
    if (updateMutation.isPending) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handler);
      return () => {
        window.removeEventListener("beforeunload", handler);
      };
    }
  }, [updateMutation.isPending]);

  function onValidationFailed(errs: FieldErrors<EditPatientFormInput>) {
    const missing: { label: string; tab: TabKey }[] = [];
    for (const field of Object.keys(FIELD_TAB_MAP)) {
      if (errs[field as keyof EditPatientFormInput]) {
        missing.push({
          label: FIELD_TAB_MAP[field].label,
          tab: FIELD_TAB_MAP[field].tab,
        });
      }
    }
    if (missing.length > 0) {
      setValidationBanner(missing.map((m) => m.label));
      if (!FIELD_TAB_MAP[Object.keys(errs)[0] as keyof EditPatientFormInput]) return;
      setActiveTab(missing[0].tab);
    }
  }

  const age = useMemo(() => computeAge(dobValue), [dobValue]);

  const medicationSuggestionService = useMemo(() => new SupabaseMedicationSuggestionService(), []);

  const appointmentList = useMemo(() => clinical?.appointments ?? [], [clinical?.appointments]);
  const lastVisit = useMemo(() => {
    const latest = [...appointmentList].sort((a, b) =>
      b.appointment_date.localeCompare(a.appointment_date),
    )[0];
    return latest ?? null;
  }, [appointmentList]);
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
    setValidationBanner(null);
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
          toast.success("Patient saved successfully.");
          void navigate("/patients");
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
      <div className="mx-auto max-w-6xl space-y-4">
        <button
          type="button"
          onClick={() => {
            void navigate(`/patients/${id}`);
          }}
          className="inline-flex items-center gap-1 text-base text-gray-600 hover:text-gray-900"
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
              Save Patient
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

        {validationBanner && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
            <p className="font-semibold text-red-800">
              Please complete all required fields before saving.
            </p>
            <ul className="mt-1 list-disc pl-5 text-red-600">
              {validationBanner.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <FormProvider {...methods}>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-1">
            <div className="flex gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                  }}
                  className={`flex-shrink-0 rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit, onValidationFailed)}>
            <div className="animate-fade-in rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <User className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">Patient Overview</h2>
                  </div>

                  <PatientPersonalSection register={register} errors={errors} age={age} />

                  <div className="border-t border-gray-100 pt-6">
                    <PatientContactSection register={register} errors={errors} />
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <PatientAddressSection
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      watch={watch}
                    />
                  </div>

                  {!isReceptionist && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-2">
                        <Pill className="text-brand-600 h-4 w-4" />
                        <h3 className="text-sm font-medium text-gray-700">Current Medications</h3>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                          {(clinical?.medications ?? []).length}
                        </span>
                      </div>
                      {(clinical?.medications ?? []).length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {clinical?.medications.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
                            >
                              {m.medication_name}
                              {m.dosage ? ` ${m.dosage}` : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400">
                          No medications recorded. Add them in the Medications tab.
                        </p>
                      )}
                    </div>
                  )}

                  {!isReceptionist && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="text-brand-600 h-4 w-4" />
                        <h3 className="text-sm font-medium text-gray-700">Current Conditions</h3>
                        {primaryDiagnosisValue && (
                          <span className="bg-brand-50 text-brand-700 rounded-full px-2 py-0.5 text-xs">
                            {primaryDiagnosisValue}
                          </span>
                        )}
                      </div>
                      {!primaryDiagnosisValue && (
                        <p className="mt-2 text-xs text-gray-400">
                          Primary diagnosis not set. Set it in the Dermatology tab.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "medical-history" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
                  </div>

                  <MedicalHistorySection />

                  <div className="border-t border-gray-100 pt-6">
                    <FamilyHistorySection />
                  </div>
                </div>
              )}

              {activeTab === "dermatology" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sun className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">Dermatology</h2>
                  </div>

                  <DermatologySection />
                </div>
              )}

              {activeTab === "medications" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Pill className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">Medications</h2>
                  </div>

                  <MedicationSection
                    medications={clinical?.medications ?? []}
                    adding={addMedication.isPending}
                    onAdd={(input) => {
                      addMedication.mutate(input);
                    }}
                    onRemove={(itemId) => {
                      removeMedication.mutate(itemId);
                    }}
                    suggestionService={medicationSuggestionService}
                  />
                </div>
              )}

              {activeTab === "alerts" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">Alerts & Notes</h2>
                  </div>

                  <div className="space-y-6">
                    <MedicalAlertsSection
                      register={register}
                      errors={errors}
                      alerts={clinical?.alerts ?? []}
                      pendingAlerts={[]}
                      chronicConditions={patient.chronic_conditions ?? ""}
                    />
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
                </div>
              )}

              {activeTab === "lifestyle" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Activity className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">Lifestyle</h2>
                  </div>

                  <LifestyleSection register={register} gender={genderValue} />
                </div>
              )}
            </div>
          </form>
        </FormProvider>

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
