import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCreateQuickPatient } from "@presentation/hooks/usePatients";
import { useBookAppointment } from "@presentation/hooks/useAppointments";
import { useAuth } from "@presentation/hooks/useAuth";
import { useToast } from "@presentation/hooks/useToast";
import { getSupabaseClient } from "@infrastructure/supabase/client";
import { X, Search, Loader2, UserCheck, Plus, Stethoscope, ChevronRight } from "lucide-react";

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

interface FoundPatient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  phone: string | null;
  gender: string | null;
  dob: string | null;
}

export function WalkInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const createPatient = useCreateQuickPatient();
  const bookAppointment = useBookAppointment();

  const [mobile, setMobile] = useState("");
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [matchedPatients, setMatchedPatients] = useState<FoundPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<FoundPatient | null>(null);

  // New Patient Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  // Symptoms state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [showSymptomDropdown, setShowSymptomDropdown] = useState(false);
  const symptomDropdownRef = useRef<HTMLDivElement>(null);

  const [loadingAction, setLoadingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  if (!open) return null;

  async function handleSearchPhone(e: React.SyntheticEvent) {
    e.preventDefault();
    const cleanedMobile = mobile.trim();
    if (!cleanedMobile) return;

    setSearching(true);
    setLoadingError(null);
    setSelectedPatient(null);

    try {
      const client = getSupabaseClient();
      const { data, error } = (await client
        .from("patients")
        .select("id,first_name,last_name,mrn,phone,gender,dob")
        .neq("status", "deregistered")
        .ilike("phone", `%${cleanedMobile}%`)
        .limit(5)) as unknown as {
        data: FoundPatient[] | null;
        error: { message: string } | null;
      };

      if (error) throw new Error(error.message);
      setMatchedPatients(data ?? []);
      setHasSearched(true);
      if (data && data.length === 1) {
        setSelectedPatient(data[0]);
      }
    } catch (err) {
      setLoadingError(err instanceof Error ? err.message : "Error searching patient");
    } finally {
      setSearching(false);
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

  async function handleStartConsultationExisting(patient: FoundPatient) {
    if (!user?.id) return;
    setSubmitting(true);
    setLoadingError(null);

    const today = new Date().toISOString().slice(0, 10);
    const symptomsString = selectedSymptoms.join(", ");

    try {
      await bookAppointment.mutateAsync({
        input: {
          patient_id: patient.id,
          appointment_date: today,
          duration_minutes: 30,
          type: "in_person",
          reason: symptomsString ? `Walk-in: ${symptomsString}` : "Walk-in Consultation",
        },
        userId: user.id,
      });

      toast.success("Walk-in appointment scheduled.");
      onClose();
      void navigate(`/patients/${patient.id}/edit`);
    } catch (err) {
      setLoadingError(err instanceof Error ? err.message : "Failed to start consultation");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterAndStart(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user?.id) return;

    if (!firstName.trim() || !lastName.trim() || (!dob && !age.trim()) || !gender) {
      setLoadingError("Please fill in required fields (Name, Gender, Age/DOB).");
      return;
    }

    setSubmitting(true);
    setLoadingError(null);

    let calculatedDob = dob;
    if (!calculatedDob && age.trim()) {
      const ageYears = parseInt(age.trim(), 10);
      if (!isNaN(ageYears)) {
        const birthYear = new Date().getFullYear() - ageYears;
        calculatedDob = `${birthYear}-01-01`;
      }
    }

    const mrn = `MRN-${Date.now()}`;
    const symptomsString = selectedSymptoms.join(", ");

    try {
      const created = await createPatient.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: mobile.trim(),
        dob: calculatedDob || new Date().toISOString().slice(0, 10),
        gender,
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

      const today = new Date().toISOString().slice(0, 10);
      await bookAppointment.mutateAsync({
        input: {
          patient_id: created.id,
          appointment_date: today,
          duration_minutes: 30,
          type: "in_person",
          reason: symptomsString ? `Walk-in: ${symptomsString}` : "Walk-in Consultation",
        },
        userId: user.id,
      });

      toast.success("Patient registered & consultation started.");
      onClose();
      void navigate(`/patients/${created.id}/edit`);
    } catch (err) {
      setLoadingError(err instanceof Error ? err.message : "Failed to register patient");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Walk-in Patient Entry</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[80vh] space-y-4 overflow-y-auto p-5">
          {/* Mobile search form */}
          <form
            onSubmit={(e) => {
              void handleSearchPhone(e);
            }}
            className="space-y-2"
          >
            <label className="block text-xs font-semibold text-slate-700">
              Mobile / Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setHasSearched(false);
                    setSelectedPatient(null);
                  }}
                  placeholder="Enter phone number..."
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !mobile.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
              </button>
            </div>
          </form>

          {/* Search results or Quick Registration */}
          {hasSearched && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              {matchedPatients.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wider text-teal-800 uppercase">
                    Found Existing Patient(s)
                  </p>
                  <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-slate-50">
                    {matchedPatients.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          selectedPatient?.id === p.id ? "bg-teal-50/80" : ""
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            MRN: {p.mrn} &middot; Phone: {p.phone ?? "—"} &middot; {p.gender ?? "—"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(p);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Select
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  No existing patient found with phone &quot;{mobile}&quot;. Please register below.
                </div>
              )}

              {/* Symptoms Input (applicable to both existing and new) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Symptoms / Reason for Visit
                </label>
                <div ref={symptomDropdownRef} className="relative">
                  <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1.5 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
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
                        selectedSymptoms.length === 0
                          ? "Select or type symptoms..."
                          : "Add symptom..."
                      }
                      className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
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

              {/* Action Form: Existing vs New */}
              {selectedPatient ? (
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      void handleStartConsultationExisting(selectedPatient);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                    Start Consultation
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    void handleRegisterAndStart(e);
                  }}
                  className="space-y-3 pt-2"
                >
                  <p className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                    Quick Registration
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                        }}
                        required
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                        }}
                        required
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                        }}
                        required
                        className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Age (Years) / DOB <span className="text-rose-500">*</span>
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="number"
                          placeholder="Age"
                          value={age}
                          onChange={(e) => {
                            setAge(e.target.value);
                            if (e.target.value) setDob("");
                          }}
                          className="w-20 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                        />
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => {
                            setDob(e.target.value);
                            if (e.target.value) setAge("");
                          }}
                          className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {loadingAction && (
                    <div className="rounded-md bg-rose-50 p-2 text-xs font-medium text-rose-600">
                      {loadingAction}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Register &amp; Start Consultation
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
