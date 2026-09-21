import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm, FormProvider, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditPatientFormSchema,
  type EditPatientFormInput,
  type UpdatePatientInput,
} from "@domain/patient";
import { usePatient, useUpdatePatient } from "@presentation/hooks/usePatients";
import {
  usePatientClinicalData,
  useAddMedication,
  useRemoveMedication,
  useAddClinicalNote,
} from "@presentation/hooks/useClinical";
import {
  useCompleteLatestAppointment,
  useBookAppointment,
} from "@presentation/hooks/useAppointments";
import { useProfile } from "@presentation/hooks/useProfile";
import { useAuth } from "@presentation/hooks/useAuth";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import {
  PatientHeader,
  type PatientHeaderData,
} from "@presentation/components/patient/PatientHeader";
import { DermatologySection } from "@presentation/components/patient/DermatologySection";
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { SupabaseMedicationSuggestionService } from "@infrastructure/supabase/medication/SupabaseMedicationSuggestionService";
import { ArrowLeft, Loader2, Save, Pill, Sparkles, Sun } from "lucide-react";

function parseTimelineSnapshots(
  raw: string | null | undefined,
): { timestamp: string; data: Record<string, unknown> }[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) return p as { timestamp: string; data: Record<string, unknown> }[];
  } catch {
    /* ignore */
  }
  return [];
}

const TABS = [
  { key: "dermatology", label: "Dermatology" },
  { key: "medications", label: "Medications" },
  { key: "alerts", label: "Doctor's Notes" },
  { key: "follow-up-plans", label: "Follow up Date and Plans" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FIELD_TAB_MAP: Record<string, { tab: TabKey; label: string }> = {
  current_treatment: { tab: "dermatology", label: "Current Treatment" },
  date_of_onset: { tab: "dermatology", label: "Date of Onset" },
  symptoms: { tab: "dermatology", label: "Symptoms" },
};

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { user } = useAuth();
  const updateMutation = useUpdatePatient();
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const addMedication = useAddMedication(id ?? "");
  const removeMedication = useRemoveMedication(id ?? "");
  const addNote = useAddClinicalNote(id ?? "");
  const toast = useToast();
  const completeAppointment = useCompleteLatestAppointment();
  const bookAppointment = useBookAppointment();

  const isReceptionist = profile?.role === "receptionist";
  const [activeTab, setActiveTab] = useState<TabKey>("dermatology");
  const [validationBanner, setValidationBanner] = useState<string[] | null>(null);

  const methods = useForm<EditPatientFormInput>({
    resolver: zodResolver(EditPatientFormSchema),
    defaultValues: { gender: "", symptoms: "", primary_diagnosis: "", status: "active" },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (patient) {
      reset({
        first_name: patient.first_name,
        last_name: patient.last_name,
        dob: patient.dob || "",
        gender: patient.gender || "",
        blood_group: patient.blood_group || "",
        email: patient.email || "",
        phone: patient.phone || "",
        mrn: patient.mrn,
        status: patient.status,
        address_line1: patient.address_line1 || patient.address || "",
        address_line2: patient.address_line2 || "",
        landmark: patient.landmark || "",
        city: patient.city || "",
        district: patient.district || "",
        state: patient.state || "",
        country: patient.country || "",
        postal_code: patient.postal_code || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
        emergency_contact_relationship: patient.emergency_contact_relationship || "",
        chronic_conditions: "",
        primary_diagnosis: patient.primary_diagnosis || "",
        secondary_diagnosis: patient.secondary_diagnosis || "",
        skin_type: "",
        affected_body_areas: "",
        disease_severity: patient.disease_severity || "",
        duration: "",
        current_flare: patient.current_flare ?? false,
        previous_skin_cancer: patient.previous_skin_cancer ?? false,
        current_treatment: "",
        medical_notes: patient.medical_notes || "",
        chief_complaint: patient.chief_complaint || "",
        present_illness: "",
        previous_skin_diseases: patient.previous_skin_diseases || "",
        previous_surgeries: patient.previous_surgeries || "",
        other_medical_conditions: patient.other_medical_conditions || "",
        family_history: patient.family_history || "",
        family_history_skin: patient.family_history_skin || "",
        family_history_cancer: patient.family_history_cancer || "",
        smoking_status: patient.smoking_status || "",
        alcohol_consumption: patient.alcohol_consumption || "",
        pregnancy_status: patient.pregnancy_status || "",
        date_of_onset: "",
        symptoms: "",
        sun_exposure_history: patient.sun_exposure_history || "",
        cosmetic_product_usage: patient.cosmetic_product_usage || "",
        occupational_exposure: patient.occupational_exposure || "",
        height_cm: patient.height_cm ?? undefined,
        weight_kg: patient.weight_kg ?? undefined,
        follow_up_date: patient.follow_up_date || "",
        follow_up_plan: patient.follow_up_plan || "",
        follow_up_instructions: patient.follow_up_instructions || "",
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

    // Map all form fields to their respective tab information (key + label)
    const errorFieldToTabMap: Record<string, { key: TabKey; label: string }> = {
      ...FIELD_TAB_MAP,
      follow_up_date: { key: "follow-up-plans", label: "Follow up Date" },
      follow_up_plan: { key: "follow-up-plans", label: "Follow up Plan" },
      follow_up_instructions: { key: "follow-up-plans", label: "Follow up Instructions" },
      chronic_conditions: { key: "dermatology", label: "Chronic Conditions" },
      primary_diagnosis: { key: "dermatology", label: "Primary Diagnosis" },
      secondary_diagnosis: { key: "dermatology", label: "Secondary Diagnosis" },
      skin_type: { key: "dermatology", label: "Skin Type" },
      affected_body_areas: { key: "dermatology", label: "Affected Body Areas" },
      disease_severity: { key: "dermatology", label: "Disease Severity" },
      duration: { key: "dermatology", label: "Duration" },
      current_flare: { key: "dermatology", label: "Current Flare" },
      previous_skin_cancer: { key: "dermatology", label: "Previous Skin Cancer" },
      current_treatment: { key: "dermatology", label: "Current Treatment" },
      medical_notes: { key: "dermatology", label: "Medical Notes" },
      chief_complaint: { key: "dermatology", label: "Chief Complaint" },
      present_illness: { key: "dermatology", label: "Present Illness" },
      previous_skin_diseases: { key: "dermatology", label: "Previous Skin Diseases" },
      previous_surgeries: { key: "dermatology", label: "Previous Surgeries" },
      other_medical_conditions: { key: "dermatology", label: "Other Medical Conditions" },
      family_history: { key: "dermatology", label: "Family History" },
      family_history_skin: { key: "dermatology", label: "Family History (Skin)" },
      family_history_cancer: { key: "dermatology", label: "Family History (Cancer)" },
      smoking_status: { key: "dermatology", label: "Smoking Status" },
      alcohol_consumption: { key: "dermatology", label: "Alcohol Consumption" },
      pregnancy_status: { key: "dermatology", label: "Pregnancy Status" },
      date_of_onset: { key: "dermatology", label: "Date of Onset" },
      symptoms: { key: "dermatology", label: "Symptoms" },
      sun_exposure_history: { key: "dermatology", label: "Sun Exposure" },
      cosmetic_product_usage: { key: "dermatology", label: "Cosmetic Usage" },
      occupational_exposure: { key: "dermatology", label: "Occupational Exposure" },
      height_cm: { key: "dermatology", label: "Height (cm)" },
      weight_cm: { key: "dermatology", label: "Weight (kg)" },
      first_name: { key: "dermatology", label: "First Name" },
      last_name: { key: "dermatology", label: "Last Name" },
      dob: { key: "dermatology", label: "Date of Birth" },
      gender: { key: "dermatology", label: "Gender" },
      blood_group: { key: "dermatology", label: "Blood Group" },
      email: { key: "dermatology", label: "Email" },
      phone: { key: "dermatology", label: "Phone" },
      mrn: { key: "dermatology", label: "MRN" },
      status: { key: "dermatology", label: "Status" },
      address_line1: { key: "dermatology", label: "Address Line 1" },
      address_line2: { key: "dermatology", label: "Address Line 2" },
      landmark: { key: "dermatology", label: "Landmark" },
      city: { key: "dermatology", label: "City" },
      district: { key: "dermatology", label: "District" },
      state: { key: "dermatology", label: "State" },
      country: { key: "dermatology", label: "Country" },
      postal_code: { key: "dermatology", label: "Postal Code" },
      emergency_contact_name: { key: "dermatology", label: "Emergency Contact Name" },
      emergency_contact_phone: { key: "dermatology", label: "Emergency Contact Phone" },
      emergency_contact_relationship: {
        key: "dermatology",
        label: "Emergency Contact Relationship",
      },
    };

    for (const field of Object.keys(errs)) {
      const fieldKey = field as keyof EditPatientFormInput;
      const tabInfo = errorFieldToTabMap[fieldKey];
      if (tabInfo) {
        missing.push({
          label: tabInfo.label,
          tab: tabInfo.key,
        });
      }
    }

    if (missing.length > 0) {
      const uniqueMissing = missing.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.label === item.label && t.tab === item.tab),
      );
      setValidationBanner(uniqueMissing.map((m) => m.label));
      if (uniqueMissing.length > 0) {
        setActiveTab(uniqueMissing[0].tab);
      }
    }
  }

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
    const existingSnapshots = parseTimelineSnapshots(patient.cosmetic_product_usage);
    const snapshot = { timestamp: new Date().toISOString(), data: { ...data } };
    const newSnapshots = [...existingSnapshots, snapshot];
    const base: UpdatePatientInput = isReceptionist
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
    const payload: UpdatePatientInput = {
      ...base,
      cosmetic_product_usage: JSON.stringify(newSnapshots),
    };
    delete (payload as Record<string, unknown>).follow_up_date;
    delete (payload as Record<string, unknown>).follow_up_plan;
    delete (payload as Record<string, unknown>).follow_up_instructions;
    updateMutation.mutate(
      { id, input: payload },
      {
        onSuccess: () => {
          void (async () => {
            if (user?.id) {
              try {
                await completeAppointment.mutateAsync({ patientId: id, userId: user.id });
              } catch {
                /* no active appointment to complete */
              }
            }
            if (data.follow_up_date && user?.id) {
              try {
                await bookAppointment.mutateAsync({
                  input: {
                    patient_id: id,
                    appointment_date: data.follow_up_date,
                    duration_minutes: 30,
                    type: "in_person",
                    reason: data.follow_up_plan || "Follow-up consultation",
                    notes: data.follow_up_instructions || undefined,
                  },
                  userId: user.id,
                });
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Failed to schedule follow-up appointment",
                );
              }
            }
            toast.success("Patient saved successfully.");
            void navigate("/patients");
          })();
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
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patient
        </button>

        {isReceptionist && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Patient
            </button>
          </div>
        </PatientHeader>

        {updateMutation.isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {updateMutation.error.message}
          </div>
        )}

        {validationBanner && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
            <p className="font-bold text-rose-700">
              Please complete all required fields before saving.
            </p>
            <ul className="mt-1.5 list-disc pl-5 font-medium text-rose-500">
              {validationBanner.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <FormProvider {...methods}>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-1.5">
            <div className="flex gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                  }}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit, onValidationFailed)}>
            <div className="animate-fade-in rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              {activeTab === "dermatology" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sun className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">Dermatology</h2>
                  </div>

                  <DermatologySection />
                </div>
              )}

              {activeTab === "medications" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Pill className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">Medications</h2>
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
                    prescribingDoctor={
                      profile?.firstName
                        ? `Dr. ${profile.firstName} ${profile.lastName}`
                        : undefined
                    }
                  />
                </div>
              )}

              {activeTab === "alerts" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">
                      Doctor&apos;s Notes
                    </h2>
                  </div>

                  <ClinicalNotesSection
                    notes={clinical?.clinicalNotes ?? []}
                    adding={addNote.isPending}
                    onAdd={(input) => {
                      addNote.mutate(input);
                    }}
                  />
                </div>
              )}

              {activeTab === "follow-up-plans" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">
                      Follow up Date and Plans
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Follow Up Date
                        </label>
                        <input
                          type="date"
                          {...register("follow_up_date")}
                          className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                        />
                        {errors.follow_up_date && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.follow_up_date.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Follow Up Plan
                      </label>
                      <textarea
                        {...register("follow_up_plan")}
                        rows={4}
                        className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                        placeholder="Enter follow-up plan details..."
                      />
                      {errors.follow_up_plan && (
                        <p className="mt-1 text-sm text-red-600">{errors.follow_up_plan.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Follow Up Instructions
                      </label>
                      <textarea
                        {...register("follow_up_instructions")}
                        rows={4}
                        className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                        placeholder="Enter follow-up instructions..."
                      />
                      {errors.follow_up_instructions && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.follow_up_instructions.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
