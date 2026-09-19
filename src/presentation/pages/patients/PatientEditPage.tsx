import { useMemo, useEffect, useState, useRef } from "react";
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
import { PatientPersonalSection } from "@presentation/components/patient/PatientPersonalSection";
import { PatientContactSection } from "@presentation/components/patient/PatientContactSection";
import { PatientAddressSection } from "@presentation/components/patient/PatientAddressSection";
import { MedicalHistorySection } from "@presentation/components/patient/MedicalHistorySection";
import { FamilyHistorySection } from "@presentation/components/patient/FamilyHistorySection";
import { DermatologySection } from "@presentation/components/patient/DermatologySection";
import { MedicationSection } from "@presentation/components/patient/MedicationSection";
import { MedicalAlertsSection } from "@presentation/components/patient/MedicalAlertsSection";
import { ClinicalNotesSection } from "@presentation/components/patient/ClinicalNotesSection";
import { computeAge } from "@presentation/components/patient/utils";
import { SupabaseMedicationSuggestionService } from "@infrastructure/supabase/medication/SupabaseMedicationSuggestionService";
import { ArrowLeft, Loader2, Save, User, HeartPulse, Pill, Sparkles, Sun, X } from "lucide-react";

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
  { key: "overview", label: "Patient Overview" },
  { key: "dermatology", label: "Dermatology" },
  { key: "medical-history", label: "Medical History" },
  { key: "medications", label: "Medications" },
  { key: "alerts", label: "Alerts & Notes" },
  { key: "follow-up-plans", label: "Follow up Date and Plans" },
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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [validationBanner, setValidationBanner] = useState<string[] | null>(null);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergyOpen, setAllergyOpen] = useState(false);
  const allergyRef = useRef<HTMLDivElement>(null);

  const methods = useForm<EditPatientFormInput>({
    resolver: zodResolver(EditPatientFormSchema),
    defaultValues: { gender: "", symptoms: "", primary_diagnosis: "", status: "active" },
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
  const otherMedicalVal = watch("other_medical_conditions");

  useEffect(() => {
    if (patient) {
      const snapshots = parseTimelineSnapshots(patient.cosmetic_product_usage);
      const sorted = [...snapshots].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const latest = sorted.length > 0 ? sorted[0].data : ({} as Record<string, unknown>);

      reset({
        first_name: (latest.first_name as string) || patient.first_name,
        last_name: (latest.last_name as string) || patient.last_name,
        dob: (latest.dob as string) || patient.dob || "",
        gender: (latest.gender as string) || patient.gender || "",
        blood_group: (latest.blood_group as string) || patient.blood_group || "",
        email: (latest.email as string) || patient.email || "",
        phone: (latest.phone as string) || patient.phone || "",
        mrn: (latest.mrn as string) || patient.mrn,
        status: (latest.status as string) || patient.status,
        address_line1:
          (latest.address_line1 as string) || patient.address_line1 || patient.address || "",
        address_line2: (latest.address_line2 as string) || patient.address_line2 || "",
        landmark: (latest.landmark as string) || patient.landmark || "",
        city: (latest.city as string) || patient.city || "",
        district: (latest.district as string) || patient.district || "",
        state: (latest.state as string) || patient.state || "",
        country: (latest.country as string) || patient.country || "",
        postal_code: (latest.postal_code as string) || patient.postal_code || "",
        emergency_contact_name:
          (latest.emergency_contact_name as string) || patient.emergency_contact_name || "",
        emergency_contact_phone:
          (latest.emergency_contact_phone as string) || patient.emergency_contact_phone || "",
        emergency_contact_relationship:
          (latest.emergency_contact_relationship as string) ||
          patient.emergency_contact_relationship ||
          "",
        chronic_conditions:
          (latest.chronic_conditions as string) || patient.chronic_conditions || "",
        primary_diagnosis: (latest.primary_diagnosis as string) || patient.primary_diagnosis || "",
        secondary_diagnosis:
          (latest.secondary_diagnosis as string) || patient.secondary_diagnosis || "",
        skin_type: (latest.skin_type as string) || patient.skin_type || "",
        affected_body_areas:
          (latest.affected_body_areas as string) || patient.affected_body_areas || "",
        disease_severity: (latest.disease_severity as string) || patient.disease_severity || "",
        duration: (latest.duration as string) || patient.duration || "",
        current_flare:
          ("current_flare" in latest ? (latest.current_flare as boolean) : patient.current_flare) ??
          false,
        previous_skin_cancer:
          ("previous_skin_cancer" in latest
            ? (latest.previous_skin_cancer as boolean)
            : patient.previous_skin_cancer) ?? false,
        current_treatment: (latest.current_treatment as string) || patient.current_treatment || "",
        medical_notes: (latest.medical_notes as string) || patient.medical_notes || "",
        chief_complaint: (latest.chief_complaint as string) || patient.chief_complaint || "",
        present_illness: (latest.present_illness as string) || patient.present_illness || "",
        previous_skin_diseases:
          (latest.previous_skin_diseases as string) || patient.previous_skin_diseases || "",
        previous_surgeries:
          (latest.previous_surgeries as string) || patient.previous_surgeries || "",
        other_medical_conditions:
          (latest.other_medical_conditions as string) || patient.other_medical_conditions || "",
        family_history: (latest.family_history as string) || patient.family_history || "",
        family_history_skin:
          (latest.family_history_skin as string) || patient.family_history_skin || "",
        family_history_cancer:
          (latest.family_history_cancer as string) || patient.family_history_cancer || "",
        smoking_status: (latest.smoking_status as string) || patient.smoking_status || "",
        alcohol_consumption:
          (latest.alcohol_consumption as string) || patient.alcohol_consumption || "",
        pregnancy_status: (latest.pregnancy_status as string) || patient.pregnancy_status || "",
        date_of_onset: (latest.date_of_onset as string) || patient.date_of_onset || "",
        symptoms: (latest.symptoms as string) || patient.symptoms || "",
        sun_exposure_history:
          (latest.sun_exposure_history as string) || patient.sun_exposure_history || "",
        cosmetic_product_usage: patient.cosmetic_product_usage || "",
        occupational_exposure:
          (latest.occupational_exposure as string) || patient.occupational_exposure || "",
        follow_up_date: (latest.follow_up_date as string) || patient.follow_up_date || "",
        follow_up_plan: (latest.follow_up_plan as string) || patient.follow_up_plan || "",
        follow_up_instructions:
          (latest.follow_up_instructions as string) || patient.follow_up_instructions || "",
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

  useEffect(() => {
    if (!allergyOpen) return;
    function handler(e: MouseEvent) {
      if (allergyRef.current && !allergyRef.current.contains(e.target as Node)) {
        setAllergyOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [allergyOpen]);

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
          if (user?.id) {
            completeAppointment.mutate({ patientId: id, userId: user.id });
          }
          if (data.follow_up_date && user?.id) {
            bookAppointment.mutate({
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
          }
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

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="mb-4 text-base font-semibold text-gray-900">Allergic to:</h3>
                    <div ref={allergyRef} className="relative">
                      <div className="focus-within:border-brand-500 focus-within:ring-brand-500 flex min-h-[38px] flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 focus-within:ring-1">
                        {(() => {
                          const tags = (otherMedicalVal ?? "")
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          return tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  setValue(
                                    "other_medical_conditions",
                                    tags.filter((t) => t !== tag).join(", "),
                                    { shouldValidate: false },
                                  );
                                }}
                                className="text-brand-400 hover:text-brand-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ));
                        })()}
                        <input
                          type="text"
                          value={allergyInput}
                          onChange={(e) => {
                            setAllergyInput(e.target.value);
                            setAllergyOpen(e.target.value.trim().length >= 1);
                          }}
                          onFocus={() => {
                            if (allergyInput.trim().length >= 1) setAllergyOpen(true);
                          }}
                          placeholder="Add allergy..."
                          className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        />
                      </div>
                      {allergyOpen &&
                        (() => {
                          const COMMON_ALLERGENS = [
                            "Dust",
                            "Pollen",
                            "Fish",
                            "Shellfish",
                            "Peanuts",
                            "Tree Nuts",
                            "Milk",
                            "Eggs",
                            "Soy",
                            "Wheat",
                            "Penicillin",
                            "Sulfa Drugs",
                            "Latex",
                            "Insect Stings",
                            "Animal Dander",
                            "Mold",
                            "Fragrances",
                          ];
                          const tags = (otherMedicalVal ?? "")
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          const suggestions = COMMON_ALLERGENS.filter(
                            (a) =>
                              !tags.includes(a) &&
                              a.toLowerCase().includes(allergyInput.trim().toLowerCase()),
                          );
                          if (suggestions.length === 0 && allergyInput.trim().length >= 1) {
                            return (
                              <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue(
                                      "other_medical_conditions",
                                      [...tags, allergyInput.trim()].join(", "),
                                      { shouldValidate: false },
                                    );
                                    setAllergyInput("");
                                    setAllergyOpen(false);
                                  }}
                                  className="text-brand-600 hover:bg-brand-50 flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                                >
                                  <span className="text-brand-600">+</span>
                                  <span>Add &quot;{allergyInput.trim()}&quot;</span>
                                </button>
                              </div>
                            );
                          }
                          if (suggestions.length > 0) {
                            return (
                              <div className="absolute z-50 mt-1 max-h-44 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                {suggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      setValue(
                                        "other_medical_conditions",
                                        [...tags, s].join(", "),
                                        { shouldValidate: false },
                                      );
                                      setAllergyInput("");
                                      setAllergyOpen(false);
                                    }}
                                    className="hover:bg-brand-50 flex w-full items-center px-3 py-2 text-left text-sm"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="mb-4 text-base font-semibold text-gray-900">Lifestyle</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Smoking Status
                        </label>
                        <select
                          {...register("smoking_status")}
                          className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="never">Never</option>
                          <option value="former">Former</option>
                          <option value="current">Current</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Alcohol Consumption
                        </label>
                        <select
                          {...register("alcohol_consumption")}
                          className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="none">None</option>
                          <option value="occasional">Occasional</option>
                          <option value="moderate">Moderate</option>
                          <option value="heavy">Heavy</option>
                        </select>
                      </div>
                      {genderValue.toLowerCase() === "female" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Pregnancy Status
                          </label>
                          <select
                            {...register("pregnancy_status")}
                            className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                          >
                            <option value="">Select</option>
                            <option value="not_pregnant">Not Pregnant</option>
                            <option value="pregnant">Pregnant</option>
                            <option value="unknown">Unknown</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
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

              {activeTab === "follow-up-plans" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-600 h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-900">
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
