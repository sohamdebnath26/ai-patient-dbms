import { useState } from "react";
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

const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-800">{value.replace(/_/g, " ")}</p>
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
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{label}</p>
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-0.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
          className="mt-0.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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

const AutoCompleteField = ({
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
  if (!editing && !value) return null;
  if (!editing) {
    return <InfoField label={label} value={value} />;
  }
  const listId = `list-${label.replace(/\s/g, "-")}`;
  return (
    <div>
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        list={listId}
        className="mt-0.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
};

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
      family_history: patient.family_history || "",
      family_history_skin: patient.family_history_skin || "",
      family_history_cancer: patient.family_history_cancer || "",
      sun_exposure_history: patient.sun_exposure_history || "",
      occupational_exposure: patient.occupational_exposure || "",
      cosmetic_product_usage: patient.cosmetic_product_usage || "",
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
    };
    delete (input as Record<string, unknown>).follow_up_date;
    delete (input as Record<string, unknown>).follow_up_plan;
    delete (input as Record<string, unknown>).follow_up_instructions;
    delete (input as Record<string, unknown>).height_cm;
    delete (input as Record<string, unknown>).weight_kg;
    updatePatientMutation.mutate(
      { id, input },
      {
        onSuccess: () => {
          toast.success("Patient info updated.");
          setEditingPatientInfo(false);
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
              <Info className="h-4 w-4" /> Patient Info
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
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  <span className="h-px flex-1 bg-gray-200" />
                  Demographics
                  <span className="h-px flex-1 bg-gray-200" />
                </h3>
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
                    value={editingPatientInfo ? editForm.blood_group : (patient.blood_group ?? "")}
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

              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                <span className="h-px flex-1 bg-gray-200" />
                Contact &amp; Address
                <span className="h-px flex-1 bg-gray-200" />
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold text-gray-400">CONTACT</p>
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
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold text-gray-400">ADDRESS</p>
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

              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                <span className="h-px flex-1 bg-gray-200" />
                Medical History
                <span className="h-px flex-1 bg-gray-200" />
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <AutoCompleteField
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
                <AutoCompleteField
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
                <AutoCompleteField
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
                {patient.previous_skin_cancer && (
                  <EditableField
                    label="Skin Cancer History"
                    value={
                      editingPatientInfo ? editForm.medical_notes : (patient.medical_notes ?? "")
                    }
                    editing={editingPatientInfo}
                    onChange={(v) => {
                      setEditForm((p) => ({ ...p, medical_notes: v }));
                    }}
                  />
                )}
              </div>

              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                <span className="h-px flex-1 bg-gray-200" />
                Lifestyle, Family &amp; Emergency
                <span className="h-px flex-1 bg-gray-200" />
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold text-gray-400">LIFESTYLE</p>
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
                    <EditableField
                      label="Family Hx"
                      value={
                        editingPatientInfo
                          ? editForm.family_history
                          : (patient.family_history ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, family_history: v }));
                      }}
                    />
                    <EditableField
                      label="Family Hx (Skin)"
                      value={
                        editingPatientInfo
                          ? editForm.family_history_skin
                          : (patient.family_history_skin ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, family_history_skin: v }));
                      }}
                    />
                    <EditableField
                      label="Family Hx (Cancer)"
                      value={
                        editingPatientInfo
                          ? editForm.family_history_cancer
                          : (patient.family_history_cancer ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, family_history_cancer: v }));
                      }}
                    />
                  </div>
                  <p className="mt-3 mb-2 text-[11px] font-bold text-gray-400">EXPOSURE</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditableField
                      label="Sun Exposure"
                      value={
                        editingPatientInfo
                          ? editForm.sun_exposure_history
                          : (patient.sun_exposure_history ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, sun_exposure_history: v }));
                      }}
                    />
                    <EditableField
                      label="Occupational"
                      value={
                        editingPatientInfo
                          ? editForm.occupational_exposure
                          : (patient.occupational_exposure ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, occupational_exposure: v }));
                      }}
                    />
                    <EditableField
                      label="Cosmetic Usage"
                      value={
                        editingPatientInfo
                          ? editForm.cosmetic_product_usage
                          : (patient.cosmetic_product_usage ?? "")
                      }
                      editing={editingPatientInfo}
                      onChange={(v) => {
                        setEditForm((p) => ({ ...p, cosmetic_product_usage: v }));
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <p className="mb-2 text-[11px] font-bold text-gray-400">EMERGENCY CONTACT</p>
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
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-50 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <p className="text-xs font-bold tracking-wider text-amber-500 uppercase">
                  Demographics
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Age" value={age !== null ? `${age} yrs` : null} />
                  <Field label="Gender" value={patient.gender} />
                  <Field label="Blood Group" value={patient.blood_group} />
                  <Field label="MRN" value={patient.mrn} />
                </div>
              </div>

              <div className="rounded-xl border border-blue-50 bg-gradient-to-br from-blue-50 to-sky-50 p-4">
                <p className="text-xs font-bold tracking-wider text-blue-500 uppercase">
                  Contact Details
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Phone" value={patient.phone} />
                  <Field label="Email" value={patient.email} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-violet-50 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
              <p className="text-xs font-bold tracking-wider text-violet-500 uppercase">
                Emergency Contact
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Name" value={patient.emergency_contact_name} />
                <Field label="Phone" value={patient.emergency_contact_phone} />
                <Field label="Relationship" value={patient.emergency_contact_relationship} />
              </div>
            </div>
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
