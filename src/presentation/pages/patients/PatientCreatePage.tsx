import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useCreateQuickPatient } from "@presentation/hooks/usePatients";
import { useBookAppointment } from "@presentation/hooks/useAppointments";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import { getSupabaseClient } from "@infrastructure/supabase/client";
import { useAuth } from "@presentation/hooks/useAuth";
import { ArrowLeft, Loader2, UserPlus, Search, X, Zap, UserCheck } from "lucide-react";
import type { Patient } from "@domain/patient";

const SUGGESTED_SYMPTOMS = [
  "Acne / Pimples",
  "Hair loss / Hair fall",
  "Dandruff",
  "Pigmentation / Dark spots",
  "Eczema / Dermatitis",
  "Skin allergy / Rash",
  "Itching / Pruritus",
  "Fungal infection",
  "Warts",
  "Skin tags / Moles",
];

const PatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(7, "Phone is required"),
  dob: z.string().optional(),
  age: z.string().optional(),
});

type PatientFormInput = z.infer<typeof PatientSchema>;

interface FoundPatient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  phone: string | null;
  gender: string | null;
  dob: string | null;
}

export function PatientCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const createMutation = useCreateQuickPatient();
  const bookMutation = useBookAppointment();

  // Mode & Search State
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [hasSearchedPhone, setHasSearchedPhone] = useState(false);
  const [matchedPatients, setMatchedPatients] = useState<FoundPatient[]>([]);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<FoundPatient | null>(null);

  // Symptoms State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [showSymptomDropdown, setShowSymptomDropdown] = useState(false);
  const symptomDropdownRef = useRef<HTMLDivElement>(null);

  // Action State
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormInput>({
    resolver: zodResolver(PatientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "",
      phone: "",
      dob: "",
      age: "",
    },
  });

  const watchAge = watch("age");
  const watchDob = watch("dob");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (symptomDropdownRef.current && !symptomDropdownRef.current.contains(e.target as Node)) {
        setShowSymptomDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handlePhoneSearch() {
    const cleanedPhone = phoneSearch.trim();
    if (!cleanedPhone) return;

    setSearchingPhone(true);
    setActionError(null);
    setSelectedExistingPatient(null);

    try {
      const client = getSupabaseClient();
      const { data, error } = (await client
        .from("patients")
        .select("id,first_name,last_name,mrn,phone,gender,dob")
        .neq("status", "deregistered")
        .ilike("phone", `%${cleanedPhone}%`)
        .limit(5)) as unknown as {
        data: FoundPatient[] | null;
        error: { message: string } | null;
      };

      if (error) throw new Error(error.message);

      setMatchedPatients(data ?? []);
      setHasSearchedPhone(true);
      if (data && data.length === 1) {
        setSelectedExistingPatient(data[0]);
      }
      setValue("phone", cleanedPhone);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error searching existing patient");
    } finally {
      setSearchingPhone(false);
    }
  }

  function addSymptom(sym: string) {
    const trimmed = sym.trim();
    if (!trimmed || selectedSymptoms.includes(trimmed)) {
      setSymptomInput("");
      setShowSymptomDropdown(false);
      return;
    }
    setSelectedSymptoms((prev) => [...prev, trimmed]);
    setSymptomInput("");
    setShowSymptomDropdown(false);
  }

  function removeSymptom(sym: string) {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== sym));
  }

  const filteredSuggestions = SUGGESTED_SYMPTOMS.filter(
    (s) =>
      s.toLowerCase().includes(symptomInput.trim().toLowerCase()) && !selectedSymptoms.includes(s),
  );

  async function handleStartConsultationForExisting(p: FoundPatient) {
    if (!user?.id) return;
    setSubmitting(true);
    setActionError(null);

    const today = new Date().toISOString().slice(0, 10);
    const symptomsString = selectedSymptoms.join(", ");

    try {
      await bookMutation.mutateAsync({
        input: {
          patient_id: p.id,
          appointment_date: today,
          duration_minutes: 30,
          type: "in_person",
          reason: symptomsString ? `Symptoms: ${symptomsString}` : "Consultation",
        },
        userId: user.id,
      });

      toast.success("Consultation scheduled for existing patient.");
      void navigate(`/patients/${p.id}/edit`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to start consultation");
    } finally {
      setSubmitting(false);
    }
  }

  async function processPatientRegistration(data: PatientFormInput, startConsultation: boolean) {
    setActionError(null);

    if (!data.dob && !data.age) {
      setActionError("Please provide either Age (Years) or Date of Birth.");
      return;
    }

    setSubmitting(true);

    let calculatedDob = data.dob;
    if (!calculatedDob && data.age) {
      const ageYears = parseInt(data.age.trim(), 10);
      if (!isNaN(ageYears)) {
        const birthYear = new Date().getFullYear() - ageYears;
        calculatedDob = `${birthYear}-01-01`;
      }
    }

    const mrn = `MRN-${Date.now()}`;
    const symptomsString = selectedSymptoms.join(", ");

    try {
      const created: Patient = await createMutation.mutateAsync({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        dob: calculatedDob || new Date().toISOString().slice(0, 10),
        gender: data.gender,
        phone: data.phone.trim(),
        mrn,
        status: "active",
        address_line1: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        primary_diagnosis: "",
        current_treatment: "",
        chief_complaint: symptomsString,
        present_illness: "",
        date_of_onset: "",
        symptoms: symptomsString,
      });

      if (startConsultation && user?.id) {
        const today = new Date().toISOString().slice(0, 10);
        await bookMutation.mutateAsync({
          input: {
            patient_id: created.id,
            appointment_date: today,
            duration_minutes: 30,
            type: "in_person",
            reason: symptomsString ? `Symptoms: ${symptomsString}` : "Consultation",
          },
          userId: user.id,
        });

        toast.success("Patient registered and consultation started.");
        void navigate(`/patients/${created.id}/edit`);
      } else {
        toast.success("Patient registered successfully.");
        void navigate(`/patients/${created.id}`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to register patient");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              void navigate("/patients");
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Patient Registration &amp; Entry
            </h1>
            <p className="text-xs text-slate-500">
              Search existing patients or register a new patient for consultation.
            </p>
          </div>
        </div>

        {/* Card 1: Existing Patient Phone Search */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            1. Existing Patient Lookup
          </h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phoneSearch}
                onChange={(e) => {
                  setPhoneSearch(e.target.value);
                  setHasSearchedPhone(false);
                  setSelectedExistingPatient(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handlePhoneSearch();
                  }
                }}
                placeholder="Enter mobile number to search..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={searchingPhone || !phoneSearch.trim()}
              onClick={() => {
                void handlePhoneSearch();
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {searchingPhone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search Phone"}
            </button>
          </div>

          {hasSearchedPhone && (
            <div className="pt-2">
              {matchedPatients.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wider text-teal-800 uppercase">
                    Matched Patient(s)
                  </p>
                  <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-slate-50">
                    {matchedPatients.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          selectedExistingPatient?.id === p.id ? "bg-teal-50" : ""
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            MRN: {p.mrn} &middot; Phone: {p.phone ?? "—"} &middot; Gender:{" "}
                            {p.gender ?? "—"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void handleStartConsultationForExisting(p);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Start Consultation
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  No existing patient record found for phone &quot;{phoneSearch}&quot;. Please
                  complete registration below.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Patient Registration Form */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
            2. Patient Registration Form
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit((data) => processPatientRegistration(data, false))(e);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("first_name")}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
                {errors.first_name && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("last_name")}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
                {errors.last_name && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Mobile / Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("gender")}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.gender.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Age (Years) or Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    placeholder="Age (Years)"
                    {...register("age")}
                    onChange={(e) => {
                      setValue("age", e.target.value);
                      if (e.target.value) setValue("dob", "");
                    }}
                    className="w-28 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                  <input
                    type="date"
                    {...register("dob")}
                    onChange={(e) => {
                      setValue("dob", e.target.value);
                      if (e.target.value) setValue("age", "");
                    }}
                    className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                {watchAge && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Will estimate birth year as {new Date().getFullYear() - parseInt(watchAge, 10)}
                  </p>
                )}
                {watchDob && (
                  <p className="mt-1 text-[10px] text-slate-400">Date of Birth set to {watchDob}</p>
                )}
              </div>
            </div>

            {/* Searchable Dermatology Symptom Suggestions */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Dermatology Symptoms / Chief Complaint
              </label>
              <div ref={symptomDropdownRef} className="relative">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-2 focus-within:border-teal-500 focus-within:bg-white">
                  {selectedSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800"
                    >
                      {sym}
                      <button
                        type="button"
                        onClick={() => {
                          removeSymptom(sym);
                        }}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => {
                      setSymptomInput(e.target.value);
                      setShowSymptomDropdown(true);
                    }}
                    onFocus={() => {
                      setShowSymptomDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (symptomInput.trim()) addSymptom(symptomInput);
                      }
                    }}
                    placeholder={
                      selectedSymptoms.length === 0 ? "Select or type symptoms..." : "Add more..."
                    }
                    className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                {showSymptomDropdown && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    {filteredSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          addSymptom(s);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {actionError && (
              <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-600">
                {actionError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  void navigate("/patients");
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Register Only
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={(e) => {
                  e.preventDefault();
                  void handleSubmit((data) => processPatientRegistration(data, true))(e);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                )}
                Register &amp; Start Consultation
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
