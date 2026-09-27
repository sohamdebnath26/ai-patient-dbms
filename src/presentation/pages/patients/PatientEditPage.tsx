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
import { useClinicalImages } from "@presentation/hooks/useClinicalImages";
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
import { ClinicalImagesSection } from "@presentation/components/patient/ClinicalImagesSection";
import { AIAnalysisSection } from "@presentation/components/patient/AIAnalysisSection";
import { SupabaseMedicationSuggestionService } from "@infrastructure/supabase/medication/SupabaseMedicationSuggestionService";
import { BODY_REGIONS } from "@presentation/components/patient/data/body-regions";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Pill,
  Sparkles,
  Sun,
  FileCheck,
  FlaskConical,
  Scissors,
  Camera,
  Calendar,
  Bot,
  MapPin,
} from "lucide-react";

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

const CONSULTATION_TABS = [
  { key: "diagnosis", label: "Diagnosis", icon: FileCheck },
  { key: "tests", label: "Tests", icon: FlaskConical },
  { key: "procedures", label: "Procedure", icon: Scissors },
  { key: "dermatology", label: "Dermatology", icon: Sun },
  { key: "medications", label: "Medications", icon: Pill },
  { key: "notes", label: "Doctor's Notes", icon: Sparkles },
  { key: "bodymap", label: "Body Map", icon: MapPin },
  { key: "images", label: "Clinical Images", icon: Camera },
  { key: "followup", label: "Follow-up", icon: Calendar },
  { key: "aianalysis", label: "AI Analysis", icon: Bot },
] as const;

type TabKey = (typeof CONSULTATION_TABS)[number]["key"];

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { user } = useAuth();
  const updateMutation = useUpdatePatient();
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const { images: clinicalImages, uploadImage, deleteImage } = useClinicalImages(id ?? "");
  const addMedication = useAddMedication(id ?? "");
  const removeMedication = useRemoveMedication(id ?? "");
  const addNote = useAddClinicalNote(id ?? "");
  const toast = useToast();
  const completeAppointment = useCompleteLatestAppointment();
  const bookAppointment = useBookAppointment();

  const isReceptionist = profile?.role === "receptionist";
  const [activeTab, setActiveTab] = useState<TabKey>("diagnosis");
  const [validationBanner, setValidationBanner] = useState<string[] | null>(null);

  // Procedure state within consultation
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [procedureInput, setProcedureInput] = useState("");

  // Tests / Lab state
  const [labTests, setLabTests] = useState<string[]>([]);
  const [labInput, setLabInput] = useState("");

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
        chronic_conditions: patient.chronic_conditions || "",
        primary_diagnosis: patient.primary_diagnosis || "",
        secondary_diagnosis: patient.secondary_diagnosis || "",
        skin_type: "",
        affected_body_areas: patient.affected_body_areas || "",
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
        symptoms: patient.symptoms || "",
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

  function onValidationFailed(errs: FieldErrors<EditPatientFormInput>) {
    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      setValidationBanner(errorKeys);
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
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }
  if (!patient) {
    return (
      <AppShell>
        <div className="py-12 text-center text-slate-500">Patient record not found.</div>
      </AppShell>
    );
  }

  function onSubmit(data: EditPatientFormInput) {
    setValidationBanner(null);
    if (!id) return;
    const existingSnapshots = parseTimelineSnapshots(patient.cosmetic_product_usage);
    const snapshot = {
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        procedures: selectedProcedures,
        requested_tests: labTests,
      },
    };
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
                /* no active appointment */
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
            toast.success("Consultation signed and finished successfully.");
            void navigate(`/patients/${id}`);
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

  // Map ClinicalImage aggregate items to UI ClinicalImage model
  const mappedClinicalImages = clinicalImages.map((img) => ({
    id: img.id,
    url: img.storage_path,
    name: img.file_name,
    uploadedAt: img.created_at,
    bodyArea: img.body_area ?? "—",
    diagnosis: img.diagnosis ?? "—",
    notes: img.notes ?? "",
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              void navigate(`/patients/${id}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Patient Profile
          </button>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="consultation-form"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-teal-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Sign &amp; Finish
            </button>
          </div>
        </div>

        {isReceptionist && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
            As a receptionist, clinical consultation fields are read-only.
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
        />

        {updateMutation.isError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
            {updateMutation.error.message}
          </div>
        )}

        {validationBanner && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
            Please complete required fields before finishing: {validationBanner.join(", ")}
          </div>
        )}

        <FormProvider {...methods}>
          {/* Horizontal Consultation Tabs */}
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-slate-100 p-1">
            <div className="flex gap-1">
              {CONSULTATION_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                    }}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-white text-teal-800 shadow-xs ring-1 ring-slate-200"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${isActive ? "text-teal-600" : "text-slate-400"}`}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consultation Form Workspace */}
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="consultation-form" onSubmit={handleSubmit(onSubmit, onValidationFailed)}>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
              {/* Tab 1: Diagnosis */}
              {activeTab === "diagnosis" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileCheck className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Diagnosis &amp; Clinical Overview
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Primary Diagnosis <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("primary_diagnosis")}
                        placeholder="e.g. Atopic Dermatitis, Psoriasis Vulgaris"
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                      {errors.primary_diagnosis && (
                        <p className="mt-1 text-xs text-rose-500">
                          {errors.primary_diagnosis.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Secondary Diagnosis
                      </label>
                      <input
                        type="text"
                        {...register("secondary_diagnosis")}
                        placeholder="Secondary clinical finding"
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Disease Severity
                      </label>
                      <select
                        {...register("disease_severity")}
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      >
                        <option value="">Select severity</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Chronic Conditions
                      </label>
                      <input
                        type="text"
                        {...register("chronic_conditions")}
                        placeholder="e.g. Hypertension, Diabetes"
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Tests */}
              {activeTab === "tests" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FlaskConical className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Lab Reports &amp; Diagnostic Tests
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Request Diagnostic / Lab Test
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={labInput}
                        onChange={(e) => {
                          setLabInput(e.target.value);
                        }}
                        placeholder="e.g. Dermoscopy, KOH Mount, Patch Test, CBC"
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (labInput.trim()) {
                            setLabTests((prev) => [...prev, labInput.trim()]);
                            setLabInput("");
                          }
                        }}
                        className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        Add Test
                      </button>
                    </div>
                    {labTests.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {labTests.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800"
                          >
                            {t}
                            <button
                              type="button"
                              onClick={() => {
                                setLabTests((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="text-teal-600 hover:text-teal-900"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Procedures */}
              {activeTab === "procedures" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Scissors className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Minor Procedures &amp; Interventions
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Perform / Schedule Procedure
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={procedureInput}
                        onChange={(e) => {
                          setProcedureInput(e.target.value);
                        }}
                        placeholder="e.g. Skin Punch Biopsy, Cryotherapy, Laser Therapy, Comedone Extraction"
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (procedureInput.trim()) {
                            setSelectedProcedures((prev) => [...prev, procedureInput.trim()]);
                            setProcedureInput("");
                          }
                        }}
                        className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        Add Procedure
                      </button>
                    </div>
                    {selectedProcedures.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {selectedProcedures.map((proc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800"
                          >
                            {proc}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProcedures((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="text-teal-600 hover:text-teal-900"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Dermatology */}
              {activeTab === "dermatology" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sun className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Detailed Dermatology Assessment
                    </h2>
                  </div>
                  <DermatologySection />
                </div>
              )}

              {/* Tab 5: Medications */}
              {activeTab === "medications" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Pill className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Prescriptions &amp; Medications
                    </h2>
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
                    prescribingDoctor={assignedDoctor}
                  />
                </div>
              )}

              {/* Tab 6: Doctor's Notes */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">Doctor&apos;s Notes (SOAP)</h2>
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

              {/* Tab 7: Body Map */}
              {activeTab === "bodymap" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Anatomical Body Region Selection
                    </h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {BODY_REGIONS.map((region) => (
                      <div
                        key={region.id}
                        className="rounded-md border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-xs font-bold text-slate-800">{region.label}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{region.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 8: Clinical Images */}
              {activeTab === "images" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Camera className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Lesion &amp; Clinical Photos
                    </h2>
                  </div>
                  <ClinicalImagesSection
                    images={mappedClinicalImages}
                    onAdd={async (file) => {
                      await uploadImage.mutateAsync({ file });
                    }}
                    onRemove={async (imageId) => {
                      await deleteImage.mutateAsync(imageId);
                    }}
                    isAdding={uploadImage.isPending}
                  />
                </div>
              )}

              {/* Tab 9: Follow-up */}
              {activeTab === "followup" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Follow-up Schedule &amp; Instructions
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Follow Up Date
                        </label>
                        <input
                          type="date"
                          {...register("follow_up_date")}
                          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Follow Up Plan
                      </label>
                      <textarea
                        {...register("follow_up_plan")}
                        rows={3}
                        placeholder="Clinical plan for next visit..."
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Instructions for Patient
                      </label>
                      <textarea
                        {...register("follow_up_instructions")}
                        rows={3}
                        placeholder="Instructions regarding sun exposure, medication routine..."
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 10: AI Analysis */}
              {activeTab === "aianalysis" && (
                <AIAnalysisSection
                  patientId={patient.id}
                  images={clinicalImages}
                  onTransferSOAPToNotes={(soapDraft) => {
                    const soapText = `Subjective:\n${soapDraft.subjective}\n\nObjective:\n${soapDraft.objective}\n\nAssessment:\n${soapDraft.assessment}\n\nPlan:\n${soapDraft.plan}`;
                    addNote.mutate({
                      note_type: "soap",
                      subjective: soapDraft.subjective,
                      objective: soapDraft.objective,
                      assessment: soapDraft.assessment,
                      plan: soapDraft.plan,
                      content: soapText,
                    });
                  }}
                />
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
