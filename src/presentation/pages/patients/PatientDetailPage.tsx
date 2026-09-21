import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  usePatient,
  useDeregisterPatient,
  useUpdatePatient,
} from "@presentation/hooks/usePatients";
import { usePatientClinicalData } from "@presentation/hooks/useClinical";
import { useProfile } from "@presentation/hooks/useProfile";
import { useToast } from "@presentation/hooks/useToast";
import { AppShell } from "@presentation/components/AppShell";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import { computeAge, formatDate } from "@presentation/components/patient/utils";
import { SectionHeading } from "@presentation/components/patient/helpers";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  ChevronDown,
  Stethoscope,
  Pill,
  UserRoundX,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Info,
  Edit3,
  Save,
  X,
  XCircle,
} from "lucide-react";
import type { UpdatePatientInput } from "@domain/patient";

interface AssessmentCard {
  bodyArea: string;
  finding: string;
  severity: string;
  onsetDate: string;
  duration: string;
  symptoms: string;
  morphology: string;
  distribution: string;
}

interface EmrSnapshot {
  timestamp: string;
  data: { family_history?: string };
}

function parseSnapshots(raw: string | null | undefined): EmrSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as EmrSnapshot[];
  } catch {
    /* ignore */
  }
  return [];
}

function parseAssessments(raw: string | null | undefined): AssessmentCard[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as AssessmentCard[];
  } catch {
    /* ignore */
  }
  return [];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${day} ${month} ${year} \u2022 ${h12}:${mm} ${ampm}`;
}

const MultiSelectField = ({
  label,
  value,
  editing,
  onChange,
  suggestions,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange?: (v: string) => void;
  suggestions: string[];
}) => {
  const [inputText, setInputText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const filtered = inputText.trim()
    ? suggestions
        .filter(
          (s) => s.toLowerCase().includes(inputText.trim().toLowerCase()) && !tags.includes(s),
        )
        .slice(0, 5)
    : [];

  useEffect(() => {
    if (!showDropdown) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [showDropdown]);

  if (!editing && tags.length === 0) return null;
  if (!editing) {
    return <InfoField label={label} value={value} />;
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInputText("");
      setShowDropdown(false);
      return;
    }
    onChange?.([...tags, trimmed].join(", "));
    setInputText("");
    setShowDropdown(false);
  }

  function removeTag(tag: string) {
    onChange?.(tags.filter((t) => t !== tag).join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (inputText.trim()) {
          addTag(inputText);
        }
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = filtered[highlightIdx];
      if (sel) {
        addTag(sel);
      } else if (inputText.trim()) {
        addTag(inputText);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  const inputClass =
    "min-w-[80px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none";

  return (
    <div ref={containerRef} className="relative">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <div className="mt-1 flex min-h-[38px] flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => {
                removeTag(tag);
              }}
              className="text-blue-400 hover:text-blue-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (e.target.value.trim()) {
              setHighlightIdx(0);
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
          }}
          onFocus={() => {
            if (inputText.trim()) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Type to search..." : "Add more..."}
          className={inputClass}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                addTag(s);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                i === highlightIdx ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
          {filtered.length === 0 && inputText.trim() && (
            <button
              type="button"
              onClick={() => {
                addTag(inputText.trim());
              }}
              className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
            >
              <span>+</span>
              <span>Add &quot;{inputText.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value.replace(/_/g, " ")}</p>
    </div>
  );
};

const EditableField = ({
  label,
  value,
  editing,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => {
  if (!editing && !value) return null;
  if (!editing) {
    return <InfoField label={label} value={value} />;
  }
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
        >
          {placeholder?.split(",").map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="mt-1 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
        />
      )}
    </div>
  );
};

const SKIN_DISEASE_SUGGESTIONS = [
  "Eczema",
  "Psoriasis",
  "Acne Vulgaris",
  "Rosacea",
  "Atopic Dermatitis",
  "Contact Dermatitis",
  "Seborrheic Dermatitis",
  "Urticaria",
  "Vitiligo",
  "Melasma",
  "Actinic Keratosis",
  "Basal Cell Carcinoma",
  "Squamous Cell Carcinoma",
  "Melanoma",
  "Dermatofibroma",
  "Keratosis Pilaris",
  "Lichen Planus",
  "Pityriasis Rosea",
  "Tinea",
  "Cellulitis",
  "Impetigo",
  "Herpes Zoster",
  "Warts",
  "Molluscum Contagiosum",
  "Alopecia Areata",
];

const SURGERY_SUGGESTIONS = [
  "Appendectomy",
  "Cholecystectomy",
  "C-Section",
  "Hysterectomy",
  "Tonsillectomy",
  "Knee Arthroscopy",
  "Hip Replacement",
  "Cataract Surgery",
  "Skin Excision",
  "Mohs Surgery",
  "Cryotherapy",
  "Laser Surgery",
  "Skin Graft",
  "Blepharoplasty",
  "Rhinoplasty",
  "Hernia Repair",
  "Thyroidectomy",
  "Coronary Bypass",
  "Angioplasty",
  "Biopsy",
];

const CHRONIC_SUGGESTIONS = [
  "Diabetes Mellitus",
  "Hypertension",
  "Asthma",
  "COPD",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Rheumatoid Arthritis",
  "Osteoarthritis",
  "Osteoporosis",
  "Coronary Artery Disease",
  "Chronic Kidney Disease",
  "Liver Cirrhosis",
  "Epilepsy",
  "Migraine",
  "Anemia",
  "Depression",
  "Anxiety Disorder",
  "Sleep Apnea",
  "GERD",
  "IBS",
  "Crohn's Disease",
  "Ulcerative Colitis",
  "Multiple Sclerosis",
  "Parkinson's Disease",
  "HIV",
];

const FAMILY_SKIN_SUGGESTIONS = [
  "Eczema",
  "Psoriasis",
  "Atopic Dermatitis",
  "Melanoma",
  "Basal Cell Carcinoma",
  "Squamous Cell Carcinoma",
  "Vitiligo",
  "Alopecia Areata",
  "Acne Vulgaris",
  "Rosacea",
  "Lupus Erythematosus",
  "Dermatomyositis",
  "Scleroderma",
  "Neurofibromatosis",
  "Xeroderma Pigmentosum",
];

const FAMILY_CANCER_SUGGESTIONS = [
  "Breast Cancer",
  "Colorectal Cancer",
  "Lung Cancer",
  "Prostate Cancer",
  "Pancreatic Cancer",
  "Leukemia",
  "Lymphoma",
  "Ovarian Cancer",
  "Cervical Cancer",
  "Liver Cancer",
  "Stomach Cancer",
  "Bladder Cancer",
  "Thyroid Cancer",
  "Renal Cell Carcinoma",
  "Multiple Myeloma",
  "Brain Tumor",
  "Esophageal Cancer",
  "Bone Cancer",
  "Testicular Cancer",
];

const SUN_EXPOSURE_SUGGESTIONS = [
  "Minimal",
  "Moderate",
  "High",
  "Very High",
  "Outdoor Occupation",
  "Beach / Swimming",
  "Tanning Beds",
  "Childhood Sunburns",
  "Chronic Recreational",
  "Sun-Protective Practices",
  "UV Therapy History",
];

const ENVIRONMENTAL_EXPOSURE_SUGGESTIONS = [
  "Chemicals",
  "Asbestos",
  "Heavy Metals",
  "Radiation",
  "Pesticides / Herbicides",
  "Industrial Solvents",
  "Air Pollution",
  "Coal / Silica Dust",
  "Petroleum Products",
  "Textile Dyes",
  "Plastics / Resins",
  "Mining Exposure",
  "Construction Dust",
  "Welding Fumes",
];

const COSMETIC_PRODUCT_SUGGESTIONS = [
  "Foundation",
  "Concealer",
  "Sunscreen",
  "Moisturizer",
  "Face Wash / Cleanser",
  "Toner",
  "Serum",
  "Retinoids / Retinol",
  "Chemical Peels",
  "Hair Dye / Bleach",
  "Perfume / Fragrance",
  "Deodorant / Antiperspirant",
  "Nail Polish / Gel",
  "Makeup Remover",
  "Exfoliant / Scrub",
  "BB / CC Cream",
  "Powder",
  "Lipstick / Lip Balm",
  "Eye Makeup",
  "Henna / Mehndi",
];

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
  "NSAIDs",
  "Aspirin",
];

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">{label}</span>
      <p className="mt-0.5 text-sm font-medium text-gray-800">{value.replace(/_/g, " ")}</p>
    </div>
  );
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id ?? "");
  const { profile } = useProfile();
  const { data: clinical } = usePatientClinicalData(id ?? "");
  const deregisterMutation = useDeregisterPatient();

  const [activeTab, setActiveTab] = useState("overview");
  const [overviewSubTab, setOverviewSubTab] = useState("details");
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<string>>(new Set());
  const [deregisterOpen, setDeregisterOpen] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [editingPatientInfo, setEditingPatientInfo] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const updatePatientMutation = useUpdatePatient();
  const toast = useToast();

  function startEditingPatientInfo() {
    setEditForm({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      dob: patient.dob || "",
      gender: patient.gender || "",
      blood_group: patient.blood_group || "",
      mrn: patient.mrn || "",
      phone: patient.phone || "",
      email: patient.email || "",
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
      chief_complaint: patient.chief_complaint || "",
      present_illness: patient.present_illness || "",
      primary_diagnosis: patient.primary_diagnosis || "",
      secondary_diagnosis: patient.secondary_diagnosis || "",
      chronic_conditions: patient.chronic_conditions || "",
      other_medical_conditions: patient.other_medical_conditions || "",
      previous_skin_diseases: patient.previous_skin_diseases || "",
      previous_surgeries: patient.previous_surgeries || "",
      medical_notes: patient.medical_notes || "",
      smoking_status: patient.smoking_status || "",
      alcohol_consumption: patient.alcohol_consumption || "",
      pregnancy_status: patient.pregnancy_status || "",
      family_history_skin: patient.family_history_skin || "",
      family_history_cancer: patient.family_history_cancer || "",
      sun_exposure_history: patient.sun_exposure_history || "",
      occupational_exposure: patient.occupational_exposure || "",
      cosmetic_product_usage: patient.cosmetic_product_usage || "",
      height_cm: patient.height_cm != null ? String(patient.height_cm) : "",
      weight_kg: patient.weight_kg != null ? String(patient.weight_kg) : "",
    });
    setEditingPatientInfo(true);
  }

  function savePatientInfo() {
    if (!id) return;
    const prevSkinCancer = patient.previous_skin_cancer ?? false;
    const prevFlare = patient.current_flare ?? false;
    const input: UpdatePatientInput = {
      ...editForm,
      previous_skin_cancer: prevSkinCancer,
      current_flare: prevFlare,
      height_cm: editForm.height_cm ? parseFloat(editForm.height_cm) : null,
      weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null,
    };
    delete (input as Record<string, unknown>).follow_up_date;
    delete (input as Record<string, unknown>).follow_up_plan;
    delete (input as Record<string, unknown>).follow_up_instructions;
    updatePatientMutation.mutate(
      { id, input },
      {
        onSuccess: () => {
          toast.success("Patient info updated.");
          setEditingPatientInfo(false);
          setShowPatientInfo(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update");
        },
      },
    );
  }

  function cancelEditingPatientInfo() {
    setEditingPatientInfo(false);
  }

  function toggleExpanded(timestamp: string) {
    setExpandedSnapshots((prev) => {
      const next = new Set(prev);
      if (next.has(timestamp)) {
        next.delete(timestamp);
      } else {
        next.add(timestamp);
      }
      return next;
    });
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="py-16 text-center text-gray-400">Patient not found.</div>
      </AppShell>
    );
  }

  const canEdit = profile?.role === "doctor" || profile?.role === "receptionist";
  const patientName = `${patient.first_name} ${patient.last_name}`.trim();
  const initials =
    patient.first_name && patient.last_name
      ? `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase()
      : "?";
  const age = computeAge(patient.dob);

  const snapshots = parseSnapshots(patient.cosmetic_product_usage).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const currentMeds = clinical?.medications ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => void navigate("/patients")}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => void navigate(`/patients/${patient.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-amber-200 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
              >
                <Pencil className="h-4 w-4" /> Start Consultation
              </button>
            )}
            <button
              onClick={() => {
                setShowPatientInfo(!showPatientInfo);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                showPatientInfo
                  ? "border-blue-400 bg-blue-50 text-blue-700 shadow-md"
                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
              }`}
            >
              {showPatientInfo ? <XCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}{" "}
              {showPatientInfo ? "Click to Hide" : "Patient Info"}
            </button>
            {patient.status !== "deregistered" && profile?.role === "doctor" && (
              <button
                type="button"
                onClick={() => {
                  setDeregisterOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <UserRoundX className="h-4 w-4" /> Deregister
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
                  <span className="text-xl font-extrabold text-white">{initials}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    {patientName}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      {patient.mrn}
                    </span>
                    {age !== null && <span>{age} yrs</span>}
                    <span className="text-gray-300">&middot;</span>
                    <span className="capitalize">{patient.gender ?? "\u2014"}</span>
                    {patient.blood_group && (
                      <>
                        <span className="text-gray-300">&middot;</span>
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                          {patient.blood_group}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {patient.phone && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
                      <Phone className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="font-medium">{patient.email}</span>
                  </div>
                )}
                {patient.city && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                      <MapPin className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <span className="font-medium">{patient.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showPatientInfo && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Patient Information
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {!editingPatientInfo ? (
                  <button
                    onClick={startEditingPatientInfo}
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blue-200 px-3 py-1.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Edit3 className="h-4 w-4" /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={savePatientInfo}
                      disabled={updatePatientMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatePatientMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={cancelEditingPatientInfo}
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-gray-200 px-3 py-1.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Demographics
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <EditableField
                      label="First Name"
                      value={editingPatientInfo ? editForm.first_name : patient.first_name}
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, first_name: v }));
                      }}
                    />
                    <EditableField
                      label="Last Name"
                      value={editingPatientInfo ? editForm.last_name : patient.last_name}
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, last_name: v }));
                      }}
                    />
                    <EditableField
                      label="Date of Birth"
                      value={editingPatientInfo ? editForm.dob : (patient.dob ?? "")}
                      editing={editingPatientInfo}
                      type="date"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, dob: v }));
                      }}
                    />
                    <InfoField label="Age" value={age !== null ? `${age} yrs` : null} />
                    <EditableField
                      label="Gender"
                      value={editingPatientInfo ? editForm.gender : (patient.gender ?? "")}
                      editing={editingPatientInfo}
                      type="select"
                      placeholder=",male,female,other"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, gender: v }));
                      }}
                    />
                    <EditableField
                      label="Blood Group"
                      value={
                        editingPatientInfo ? editForm.blood_group : (patient.blood_group ?? "")
                      }
                      editing={editingPatientInfo}
                      type="select"
                      placeholder=",A+,A-,B+,B-,AB+,AB-,O+,O-"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, blood_group: v }));
                      }}
                    />
                    <EditableField
                      label="MRN"
                      value={editingPatientInfo ? editForm.mrn : patient.mrn}
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, mrn: v }));
                      }}
                    />
                    <EditableField
                      label="Status"
                      value={editingPatientInfo ? editForm.status : patient.status}
                      editing={editingPatientInfo}
                      type="select"
                      placeholder=",active,inactive,deceased,archived,deregistered"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, status: v }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Contact &amp; Address
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3.5">
                    <p className="mb-2 text-[10px] font-extrabold tracking-wider text-gray-400">
                      CONTACT
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <EditableField
                        label="Phone"
                        value={editingPatientInfo ? editForm.phone : (patient.phone ?? "")}
                        editing={editingPatientInfo}
                        type="tel"
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, phone: v }));
                        }}
                      />
                      <EditableField
                        label="Email"
                        value={editingPatientInfo ? editForm.email : (patient.email ?? "")}
                        editing={editingPatientInfo}
                        type="email"
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, email: v }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3.5">
                    <p className="mb-2 text-[10px] font-extrabold tracking-wider text-gray-400">
                      ADDRESS
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <EditableField
                        label="Line 1"
                        value={
                          editingPatientInfo
                            ? (editForm.address_line1 ?? "")
                            : ((patient.address_line1 || patient.address) ?? "")
                        }
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, address_line1: v }));
                        }}
                      />
                      <EditableField
                        label="Line 2"
                        value={
                          editingPatientInfo
                            ? (editForm.address_line2 ?? "")
                            : (patient.address_line2 ?? "")
                        }
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, address_line2: v }));
                        }}
                      />
                      <EditableField
                        label="Landmark"
                        value={editingPatientInfo ? editForm.landmark : (patient.landmark ?? "")}
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, landmark: v }));
                        }}
                      />
                      <EditableField
                        label="City"
                        value={editingPatientInfo ? editForm.city : (patient.city ?? "")}
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, city: v }));
                        }}
                      />
                      <EditableField
                        label="District"
                        value={editingPatientInfo ? editForm.district : (patient.district ?? "")}
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, district: v }));
                        }}
                      />
                      <EditableField
                        label="State"
                        value={editingPatientInfo ? editForm.state : (patient.state ?? "")}
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, state: v }));
                        }}
                      />
                      <EditableField
                        label="Country"
                        value={editingPatientInfo ? editForm.country : (patient.country ?? "")}
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, country: v }));
                        }}
                      />
                      <EditableField
                        label="Postal Code"
                        value={
                          editingPatientInfo ? editForm.postal_code : (patient.postal_code ?? "")
                        }
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, postal_code: v }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Physical Measurements
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <EditableField
                      label="Height (cm)"
                      value={
                        editingPatientInfo
                          ? editForm.height_cm
                          : patient.height_cm != null
                            ? String(patient.height_cm)
                            : ""
                      }
                      editing={editingPatientInfo}
                      type="number"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, height_cm: v }));
                      }}
                    />
                    <EditableField
                      label="Weight (kg)"
                      value={
                        editingPatientInfo
                          ? editForm.weight_kg
                          : patient.weight_kg != null
                            ? String(patient.weight_kg)
                            : ""
                      }
                      editing={editingPatientInfo}
                      type="number"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, weight_kg: v }));
                      }}
                    />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">BMI</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const h = editingPatientInfo
                            ? parseFloat(editForm.height_cm)
                            : (patient.height_cm ?? 0);
                          const w = editingPatientInfo
                            ? parseFloat(editForm.weight_kg)
                            : (patient.weight_kg ?? 0);
                          if (h && w && h > 0) return (w / (h / 100) ** 2).toFixed(1);
                          return "\u2014";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Previous Disease &amp; Surgeries
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MultiSelectField
                      label="Chronic Conditions"
                      value={
                        editingPatientInfo
                          ? editForm.chronic_conditions
                          : (patient.chronic_conditions ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={CHRONIC_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, chronic_conditions: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Previous Skin Diseases"
                      value={
                        editingPatientInfo
                          ? editForm.previous_skin_diseases
                          : (patient.previous_skin_diseases ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={SKIN_DISEASE_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, previous_skin_diseases: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Previous Surgeries"
                      value={
                        editingPatientInfo
                          ? editForm.previous_surgeries
                          : (patient.previous_surgeries ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={SURGERY_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, previous_surgeries: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Other Med Conditions"
                      value={
                        editingPatientInfo
                          ? editForm.other_medical_conditions
                          : (patient.other_medical_conditions ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={CHRONIC_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, other_medical_conditions: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Family History (Skin)"
                      value={
                        editingPatientInfo
                          ? editForm.family_history_skin
                          : (patient.family_history_skin ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={FAMILY_SKIN_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, family_history_skin: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Family History (Cancer)"
                      value={
                        editingPatientInfo
                          ? editForm.family_history_cancer
                          : (patient.family_history_cancer ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={FAMILY_CANCER_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, family_history_cancer: v }));
                      }}
                    />
                    {patient.previous_skin_cancer && (
                      <EditableField
                        label="Skin Cancer History"
                        value={
                          editingPatientInfo
                            ? editForm.medical_notes
                            : (patient.medical_notes ?? "")
                        }
                        editing={editingPatientInfo}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, medical_notes: v }));
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Lifestyle &amp; Exposures
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditableField
                      label="Smoking"
                      value={
                        editingPatientInfo
                          ? editForm.smoking_status
                          : (patient.smoking_status ?? "")
                      }
                      editing={editingPatientInfo}
                      type="select"
                      placeholder=",never,former,current"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, smoking_status: v }));
                      }}
                    />
                    <EditableField
                      label="Alcohol"
                      value={
                        editingPatientInfo
                          ? editForm.alcohol_consumption
                          : (patient.alcohol_consumption ?? "")
                      }
                      editing={editingPatientInfo}
                      type="select"
                      placeholder=",none,occasional,moderate,heavy"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, alcohol_consumption: v }));
                      }}
                    />
                    {(patient.gender?.toLowerCase() === "female" || editingPatientInfo) && (
                      <EditableField
                        label="Pregnancy"
                        value={
                          editingPatientInfo
                            ? editForm.pregnancy_status
                            : (patient.pregnancy_status ?? "")
                        }
                        editing={editingPatientInfo}
                        type="select"
                        placeholder=",not_pregnant,pregnant,unknown"
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, pregnancy_status: v }));
                        }}
                      />
                    )}
                    <MultiSelectField
                      label="Sun Exposure"
                      value={
                        editingPatientInfo
                          ? editForm.sun_exposure_history
                          : (patient.sun_exposure_history ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={SUN_EXPOSURE_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, sun_exposure_history: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Environmental Exposure"
                      value={
                        editingPatientInfo
                          ? editForm.occupational_exposure
                          : (patient.occupational_exposure ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={ENVIRONMENTAL_EXPOSURE_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, occupational_exposure: v }));
                      }}
                    />
                    <MultiSelectField
                      label="Cosmetic & Personal Care Products"
                      value={
                        editingPatientInfo
                          ? editForm.cosmetic_product_usage
                          : (patient.cosmetic_product_usage ?? "")
                      }
                      editing={editingPatientInfo}
                      suggestions={COSMETIC_PRODUCT_SUGGESTIONS}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, cosmetic_product_usage: v }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Allergies
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <MultiSelectField
                    label="Known Allergies"
                    value={
                      editingPatientInfo
                        ? editForm.other_medical_conditions
                        : (patient.other_medical_conditions ?? "")
                    }
                    editing={editingPatientInfo}
                    suggestions={COMMON_ALLERGENS}
                    onChange={(v) => {
                      setEditForm((p) => ({ ...p, other_medical_conditions: v }));
                    }}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                  Emergency Contact
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditableField
                      label="Name"
                      value={
                        editingPatientInfo
                          ? editForm.emergency_contact_name
                          : (patient.emergency_contact_name ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, emergency_contact_name: v }));
                      }}
                    />
                    <EditableField
                      label="Phone"
                      value={
                        editingPatientInfo
                          ? editForm.emergency_contact_phone
                          : (patient.emergency_contact_phone ?? "")
                      }
                      editing={editingPatientInfo}
                      type="tel"
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, emergency_contact_phone: v }));
                      }}
                    />
                    <EditableField
                      label="Relationship"
                      value={
                        editingPatientInfo
                          ? editForm.emergency_contact_relationship
                          : (patient.emergency_contact_relationship ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, emergency_contact_relationship: v }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => {
              setActiveTab("overview");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("timeline");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "timeline"
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Timeline
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
              <button
                onClick={() => {
                  setOverviewSubTab("details");
                }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-all ${
                  overviewSubTab === "details"
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Patient Details
              </button>
              <button
                onClick={() => {
                  setOverviewSubTab("medical");
                }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-all ${
                  overviewSubTab === "medical"
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Medical History
              </button>
              <button
                onClick={() => {
                  setOverviewSubTab("family");
                }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-all ${
                  overviewSubTab === "family"
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Family &amp; Alerts
              </button>
            </div>

            {overviewSubTab === "details" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <p className="mb-3 text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                    Identification
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoField label="Name" value={patientName} />
                    <InfoField label="MRN" value={patient.mrn} />
                    <InfoField label="Age" value={age !== null ? `${age} yrs` : null} />
                    <InfoField label="Gender" value={patient.gender} />
                    <InfoField label="Blood Group" value={patient.blood_group} />
                    <InfoField label="Status" value={patient.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <p className="mb-3 text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                    Physical Measurements
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Height (cm)</p>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.height_cm != null ? patient.height_cm : "\u2014"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Weight (kg)</p>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.weight_kg != null ? patient.weight_kg : "\u2014"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">BMI</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const h = patient.height_cm;
                          const w = patient.weight_kg;
                          if (h && w && h > 0) return (w / (h / 100) ** 2).toFixed(1);
                          return "\u2014";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {overviewSubTab === "medical" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <p className="mb-3 text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                  Conditions &amp; History
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Chronic Conditions" value={patient.chronic_conditions} />
                  <InfoField
                    label="Previous Skin Diseases"
                    value={patient.previous_skin_diseases}
                  />
                  <InfoField label="Previous Surgeries" value={patient.previous_surgeries} />
                  {patient.previous_skin_cancer && (
                    <InfoField label="Skin Cancer History" value={patient.medical_notes} />
                  )}
                </div>
              </div>
            )}

            {overviewSubTab === "family" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <p className="mb-3 text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                    Family History
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoField label="Family History (Skin)" value={patient.family_history_skin} />
                    <InfoField
                      label="Family History (Cancer)"
                      value={patient.family_history_cancer}
                    />
                    <InfoField label="Family History" value={patient.family_history} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <p className="mb-3 text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                    Allergies
                  </p>
                  {(() => {
                    const clinicalAllergies = (clinical?.alerts ?? [])
                      .filter((a) => a.category === "allergy")
                      .map((a) => a.label);
                    const patientAllergies = (patient.other_medical_conditions ?? "")
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    const allAllergies = [...new Set([...clinicalAllergies, ...patientAllergies])];
                    return allAllergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allAllergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No known allergies.</p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            {snapshots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-white p-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                  <Calendar className="h-8 w-8 text-amber-400" />
                </div>
                <p className="mt-5 text-lg font-bold text-gray-900">No EMR records yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Saved EMR records from consultations will appear here.
                </p>
              </div>
            ) : (
              <div className="relative pl-10">
                <div className="absolute top-3 bottom-3 left-[10px] w-px bg-gradient-to-b from-amber-300 via-amber-200 to-transparent" />

                <div className="space-y-3">
                  {snapshots.map((snapshot) => {
                    const assessments = parseAssessments(snapshot.data.family_history);
                    const isExpanded = expandedSnapshots.has(snapshot.timestamp);

                    return (
                      <div key={snapshot.timestamp} className="relative">
                        <div className="absolute top-4 left-[-34px] z-10 h-[20px] w-[20px] rounded-full border-2 border-amber-400 bg-white shadow-sm" />

                        <div className="overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              toggleExpanded(snapshot.timestamp);
                            }}
                            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-amber-50/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                                EMR
                              </span>
                              <span className="text-sm font-bold text-gray-800">
                                {formatTimestamp(snapshot.timestamp)}
                              </span>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-amber-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-amber-50 bg-amber-50/30 px-5 py-5">
                              <div className="space-y-6">
                                <div>
                                  <SectionHeading
                                    icon={<Stethoscope className="h-4 w-4" />}
                                    title="Dermatology Assessment"
                                  />
                                  {assessments.length === 0 ? (
                                    <p className="mt-2 text-sm text-gray-400">
                                      No dermatology data recorded.
                                    </p>
                                  ) : (
                                    <div className="mt-3 space-y-4">
                                      {assessments.map((a, i) => (
                                        <div
                                          key={i}
                                          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                                        >
                                          <h4 className="mb-3 text-sm font-bold text-amber-700">
                                            Assessment {i + 1}
                                          </h4>
                                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Field label="Body Area" value={a.bodyArea} />
                                            <Field label="Finding / Lesion" value={a.finding} />
                                            <Field label="Severity" value={a.severity} />
                                            <Field
                                              label="Onset Date"
                                              value={formatDate(a.onsetDate)}
                                            />
                                            <Field label="Duration" value={a.duration} />
                                            <Field label="Symptoms" value={a.symptoms} />
                                            <Field label="Morphology" value={a.morphology} />
                                            <Field label="Distribution" value={a.distribution} />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                                    Medical Alerts
                                  </h3>
                                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                                    {(clinical?.alerts ?? []).length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {(clinical?.alerts ?? []).map((alert) => (
                                          <span
                                            key={alert.id}
                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                              alert.category === "allergy"
                                                ? "border-red-200 bg-red-50 text-red-700"
                                                : "border-yellow-200 bg-yellow-50 text-yellow-700"
                                            }`}
                                          >
                                            {alert.category === "allergy" ? "Allergy" : "Alert"}:{" "}
                                            {alert.label}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400">
                                        No known alerts or allergies.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <SectionHeading
                                    icon={<Pill className="h-4 w-4" />}
                                    title="Medications"
                                  />
                                  {currentMeds.length === 0 ? (
                                    <p className="mt-2 text-sm text-gray-400">
                                      No medications recorded.
                                    </p>
                                  ) : (
                                    <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
                                      <table className="min-w-full text-sm">
                                        <thead>
                                          <tr className="bg-gray-50 text-left text-xs font-bold text-gray-400 uppercase">
                                            <th className="px-4 py-2.5">Medication</th>
                                            <th className="px-4 py-2.5">Dose</th>
                                            <th className="px-4 py-2.5">Route</th>
                                            <th className="px-4 py-2.5">Frequency</th>
                                            <th className="px-4 py-2.5">Duration</th>
                                            <th className="px-4 py-2.5">Start</th>
                                            <th className="px-4 py-2.5">End</th>
                                            <th className="px-4 py-2.5">Doctor</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                          {currentMeds.map((med) => (
                                            <tr key={med.id}>
                                              <td className="px-4 py-2.5 font-semibold text-gray-900">
                                                {med.medication_name}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.dosage || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.route || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.frequency || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.duration || "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.start_date
                                                  ? formatDate(med.start_date)
                                                  : "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.end_date ? formatDate(med.end_date) : "\u2014"}
                                              </td>
                                              <td className="px-4 py-2.5 text-gray-600">
                                                {med.prescribing_doctor || "\u2014"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
              void navigate("/patients");
            },
          });
        }}
        onCancel={() => {
          setDeregisterOpen(false);
        }}
      />
    </AppShell>
  );
}
