import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditPatientFormSchema,
  type EditPatientFormInput,
  type UpdatePatientInput,
  type PatientStatus,
  type MedicationInput,
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
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  AlertTriangle,
  Stethoscope,
  Pill,
  CalendarDays,
  Image as ImageIcon,
  FlaskConical,
  FileText,
  Sparkles,
  History,
  Save,
  UserRoundX,
  Clock,
  Plus,
  Trash2,
  GitCompareArrows,
  RefreshCw,
} from "lucide-react";

const inputClass =
  "focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none";
const labelClass = "block text-sm font-medium text-gray-700";

function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function statusBadgeClass(status: PatientStatus): string {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700";
    case "inactive":
      return "bg-yellow-50 text-yellow-700";
    case "deceased":
      return "bg-gray-100 text-gray-600";
    case "deregistered":
      return "bg-orange-50 text-orange-600";
    case "archived":
      return "bg-red-50 text-red-600";
  }
}

function severityBadgeClass(severity: string): string {
  if (severity === "severe" || severity === "life_threatening") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (severity === "moderate") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

interface ClinicalImage {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
  bodyArea: string;
  diagnosis: string;
  notes: string;
}

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
  const [compareOpen, setCompareOpen] = useState(false);
  const [aiSummaryAt, setAiSummaryAt] = useState<Date>(new Date());

  const [medication, setMedication] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    start_date: "",
    end_date: "",
    prescribing_doctor: "",
  });

  const [note, setNote] = useState({ subjective: "", objective: "", assessment: "", plan: "" });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditPatientFormInput>({
    resolver: zodResolver(EditPatientFormSchema),
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
        family_history: patient.family_history ?? "",
        previous_skin_cancer: patient.previous_skin_cancer ?? false,
        current_treatment: patient.current_treatment ?? "",
        medical_notes: patient.medical_notes ?? "",
      });
    }
  }, [patient, reset]);

  const age = useMemo(() => computeAge(dobValue), [dobValue]);

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

  const previousAppointment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.find((a) => a.appointment_date < today) ?? null;
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

  function handleAddMedication() {
    if (!medication.medication_name.trim()) return;
    const input: MedicationInput = {
      medication_name: medication.medication_name.trim(),
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      start_date: medication.start_date || undefined,
      end_date: medication.end_date || undefined,
      prescribing_doctor: medication.prescribing_doctor,
    };
    addMedication.mutate(input, {
      onSuccess: () => {
        setMedication({
          medication_name: "",
          dosage: "",
          frequency: "",
          duration: "",
          start_date: "",
          end_date: "",
          prescribing_doctor: "",
        });
      },
    });
  }

  function handleAddNote() {
    if (
      !note.subjective.trim() &&
      !note.objective.trim() &&
      !note.assessment.trim() &&
      !note.plan.trim()
    ) {
      return;
    }
    addNote.mutate(
      {
        subjective: note.subjective || undefined,
        objective: note.objective || undefined,
        assessment: note.assessment || undefined,
        plan: note.plan || undefined,
      },
      {
        onSuccess: () => {
          setNote({ subjective: "", objective: "", assessment: "", plan: "" });
        },
      },
    );
  }

  function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        url,
        name: file.name,
        uploadedAt: new Date().toISOString(),
        bodyArea: "—",
        diagnosis: "—",
        notes: "",
      },
    ]);
    e.target.value = "";
  }

  const chronicTokens = (patient.chronic_conditions ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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

          {/* Section 2 — Personal Information */}
          <CollapsibleSection
            title="Personal Information"
            icon={<User className="h-4 w-4" />}
            defaultOpen
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>First Name *</label>
                <input {...register("first_name")} className={inputClass} />
                <FieldError message={errors.first_name?.message} />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input {...register("last_name")} className={inputClass} />
                <FieldError message={errors.last_name?.message} />
              </div>
              <div>
                <label className={labelClass}>Date of Birth *</label>
                <input type="date" {...register("dob")} className={inputClass} />
                <FieldError message={errors.dob?.message} />
                {age !== null && <p className="mt-1 text-xs text-gray-500">{age} years old</p>}
              </div>
              <div>
                <label className={labelClass}>Gender *</label>
                <select {...register("gender")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <FieldError message={errors.gender?.message} />
              </div>
              <div>
                <label className={labelClass}>Blood Group</label>
                <select {...register("blood_group")} className={inputClass}>
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select {...register("status")} disabled={isReceptionist} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                  <option value="deregistered">Deregistered</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>MRN *</label>
                <input {...register("mrn")} className={inputClass} />
                <FieldError message={errors.mrn?.message} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3 — Contact Information */}
          <CollapsibleSection title="Contact Information" icon={<MapPin className="h-4 w-4" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Phone *</label>
                <input {...register("phone")} className={inputClass} />
                <FieldError message={errors.phone?.message} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" {...register("email")} className={inputClass} />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <label className={labelClass}>Address Line 1 *</label>
                <input {...register("address_line1")} className={inputClass} />
                <FieldError message={errors.address_line1?.message} />
              </div>
              <div>
                <label className={labelClass}>Address Line 2</label>
                <input {...register("address_line2")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input {...register("city")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input {...register("state")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input {...register("country")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Postal Code</label>
                <input {...register("postal_code")} className={inputClass} />
              </div>
            </div>

            <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-500">Emergency Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input {...register("emergency_contact_name")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input {...register("emergency_contact_phone")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  {...register("emergency_contact_relationship")}
                  placeholder="e.g. Spouse, Parent"
                  className={inputClass}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4 — Medical Alerts */}
          <CollapsibleSection
            title="Medical Alerts"
            icon={<AlertTriangle className="h-4 w-4" />}
            badge={
              (clinical?.alerts.length ?? 0) > 0 ? (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  {clinical?.alerts.length}
                </span>
              ) : undefined
            }
          >
            <div className="flex flex-wrap gap-2">
              {(clinical?.alerts ?? []).map((alert) => (
                <span
                  key={alert.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${severityBadgeClass(alert.severity)}`}
                >
                  {alert.category === "allergy" ? "Allergy" : "History"}: {alert.label}
                </span>
              ))}
              {chronicTokens.map((token) => (
                <span
                  key={token}
                  className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700"
                >
                  {token}
                </span>
              ))}
              {(clinical?.alerts.length ?? 0) === 0 && chronicTokens.length === 0 && (
                <p className="text-sm text-gray-400">No known alerts.</p>
              )}
            </div>
            <div className="mt-4">
              <label className={labelClass}>Chronic Conditions</label>
              <input
                {...register("chronic_conditions")}
                placeholder="e.g. Diabetes, Hypertension, Pregnancy, Immunocompromised"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Separate multiple conditions with commas.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 5 — Dermatology Information */}
          <CollapsibleSection
            title="Dermatology Information"
            icon={<Stethoscope className="h-4 w-4" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Primary Diagnosis</label>
                <input {...register("primary_diagnosis")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Secondary Diagnosis</label>
                <input {...register("secondary_diagnosis")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Skin Type (Fitzpatrick)</label>
                <select {...register("skin_type")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="I">I — Always burns, never tans</option>
                  <option value="II">II — Usually burns, tans minimally</option>
                  <option value="III">III — Sometimes burns, tans uniformly</option>
                  <option value="IV">IV — Rarely burns, tans easily</option>
                  <option value="V">V — Very rarely burns, tans profusely</option>
                  <option value="VI">VI — Never burns, deeply pigmented</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Disease Severity</label>
                <select {...register("disease_severity")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Affected Body Areas</label>
                <input
                  {...register("affected_body_areas")}
                  placeholder="e.g. Face, Scalp, Trunk, Arms"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Duration</label>
                <input
                  {...register("duration")}
                  placeholder="e.g. 6 months"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Current Treatment</label>
                <input {...register("current_treatment")} className={inputClass} />
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    {...register("current_flare")}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Current Flare
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    {...register("previous_skin_cancer")}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Previous Skin Cancer
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Family History</label>
                <textarea {...register("family_history")} rows={2} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea {...register("medical_notes")} rows={3} className={inputClass} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6 — Medications */}
          <CollapsibleSection
            title="Medications"
            icon={<Pill className="h-4 w-4" />}
            badge={
              (clinical?.medications.length ?? 0) > 0 ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {clinical?.medications.length}
                </span>
              ) : undefined
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-2 py-2 font-medium">Medication</th>
                    <th className="px-2 py-2 font-medium">Dose</th>
                    <th className="px-2 py-2 font-medium">Frequency</th>
                    <th className="px-2 py-2 font-medium">Duration</th>
                    <th className="px-2 py-2 font-medium">Start</th>
                    <th className="px-2 py-2 font-medium">End</th>
                    <th className="px-2 py-2 font-medium">Prescribing Doctor</th>
                    <th className="px-2 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(clinical?.medications ?? []).map((m) => (
                    <tr key={m.id}>
                      <td className="px-2 py-2 font-medium text-gray-900">{m.medication_name}</td>
                      <td className="px-2 py-2 text-gray-600">{m.dosage || "—"}</td>
                      <td className="px-2 py-2 text-gray-600">{m.frequency || "—"}</td>
                      <td className="px-2 py-2 text-gray-600">{m.duration || "—"}</td>
                      <td className="px-2 py-2 text-gray-600">{formatDate(m.start_date)}</td>
                      <td className="px-2 py-2 text-gray-600">{formatDate(m.end_date)}</td>
                      <td className="px-2 py-2 text-gray-600">{m.prescribing_doctor || "—"}</td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            removeMedication.mutate(m.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(clinical?.medications.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={8} className="px-2 py-4 text-center text-gray-400">
                        No medications recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
              <MedicationField
                label="Medication"
                value={medication.medication_name}
                onChange={(v) => {
                  setMedication((p) => ({ ...p, medication_name: v }));
                }}
              />
              <MedicationField
                label="Dose"
                value={medication.dosage}
                onChange={(v) => {
                  setMedication((p) => ({ ...p, dosage: v }));
                }}
              />
              <MedicationField
                label="Frequency"
                value={medication.frequency}
                onChange={(v) => {
                  setMedication((p) => ({ ...p, frequency: v }));
                }}
              />
              <MedicationField
                label="Duration"
                value={medication.duration}
                onChange={(v) => {
                  setMedication((p) => ({ ...p, duration: v }));
                }}
              />
              <MedicationField
                label="Start Date"
                type="date"
                value={medication.start_date}
                onChange={(v) => {
                  setMedication((p) => ({ ...p, start_date: v }));
                }}
              />
              <MedicationField
                label="End Date"
                type="date"
                value={medication.end_date}
                onChange={(v) => {
                  setMedication((p) => ({ ...p, end_date: v }));
                }}
              />
              <div className="sm:col-span-2">
                <MedicationField
                  label="Prescribing Doctor"
                  value={medication.prescribing_doctor}
                  onChange={(v) => {
                    setMedication((p) => ({ ...p, prescribing_doctor: v }));
                  }}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddMedication}
                  disabled={!medication.medication_name.trim() || addMedication.isPending}
                  className="bg-brand-600 hover:bg-brand-700 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {addMedication.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Medication
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 7 — Appointment Summary */}
          <CollapsibleSection
            title="Appointment Summary"
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <div className="grid gap-4 sm:grid-cols-4">
              <AppointmentStat
                label="Upcoming Appointment"
                value={
                  upcomingAppointment ? formatDate(upcomingAppointment.appointment_date) : "None"
                }
              />
              <AppointmentStat
                label="Previous Appointment"
                value={
                  previousAppointment ? formatDate(previousAppointment.appointment_date) : "None"
                }
              />
              <AppointmentStat
                label="Last Consultation"
                value={formatDate(lastVisit?.appointment_date)}
              />
              <AppointmentStat label="Total Visits" value={String(totalVisits)} />
            </div>
            {appointments.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                {appointments.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {formatDate(a.appointment_date)}
                      {a.appointment_time ? ` · ${a.appointment_time}` : ""}
                    </span>
                    <span className="text-gray-500 capitalize">
                      {a.type} · {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          {/* Section 8 — Clinical Images */}
          <CollapsibleSection title="Clinical Images" icon={<ImageIcon className="h-4 w-4" />}>
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <Plus className="h-4 w-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImage}
                />
              </label>
              {images.length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setCompareOpen((v) => !v);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <GitCompareArrows className="h-4 w-4" />
                  Compare
                </button>
              )}
            </div>

            {compareOpen && images.length >= 2 && (
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                {images.slice(0, 2).map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200">
                    <img src={img.url} alt={img.name} className="h-48 w-full object-cover" />
                    <p className="px-3 py-2 text-xs text-gray-600">{img.name}</p>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 ? (
              <p className="text-sm text-gray-400">No clinical images uploaded.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {images.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200">
                    <img src={img.url} alt={img.name} className="h-32 w-full object-cover" />
                    <div className="space-y-1 p-3 text-xs text-gray-600">
                      <p className="font-medium text-gray-900">{img.name}</p>
                      <p>Uploaded: {formatDate(img.uploadedAt)}</p>
                      <p>Body Area: {img.bodyArea}</p>
                      <p>Diagnosis: {img.diagnosis}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setImages((prev) => prev.filter((x) => x.id !== img.id));
                        }}
                        className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Section 9 — Laboratory Reports */}
          <CollapsibleSection
            title="Laboratory Reports"
            icon={<FlaskConical className="h-4 w-4" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-2 py-2 font-medium">Report Name</th>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(clinical?.labReports ?? []).map((report) => (
                    <tr key={report.id}>
                      <td className="px-2 py-2 font-medium text-gray-900">{report.test_name}</td>
                      <td className="px-2 py-2 text-gray-600">{formatDate(report.report_date)}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                          {report.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(clinical?.labReports.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                        No laboratory reports.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          {/* Section 10 — Clinical Notes */}
          <CollapsibleSection title="Clinical Notes" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-4">
              {(clinical?.clinicalNotes ?? []).map((n) => (
                <div key={n.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-gray-700 capitalize">{n.note_type} Note</span>
                    <span>{formatDate(n.created_at)}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <NoteBlock label="S" value={n.subjective} />
                    <NoteBlock label="O" value={n.objective} />
                    <NoteBlock label="A" value={n.assessment} />
                    <NoteBlock label="P" value={n.plan} />
                  </div>
                </div>
              ))}
              {(clinical?.clinicalNotes.length ?? 0) === 0 && (
                <p className="text-sm text-gray-400">No clinical notes yet.</p>
              )}
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
              <NoteField
                label="Subjective"
                value={note.subjective}
                onChange={(v) => {
                  setNote((p) => ({ ...p, subjective: v }));
                }}
              />
              <NoteField
                label="Objective"
                value={note.objective}
                onChange={(v) => {
                  setNote((p) => ({ ...p, objective: v }));
                }}
              />
              <NoteField
                label="Assessment"
                value={note.assessment}
                onChange={(v) => {
                  setNote((p) => ({ ...p, assessment: v }));
                }}
              />
              <NoteField
                label="Plan"
                value={note.plan}
                onChange={(v) => {
                  setNote((p) => ({ ...p, plan: v }));
                }}
              />
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={addNote.isPending}
                  className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {addNote.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Note
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 11 — AI Summary */}
          <CollapsibleSection title="AI Summary" icon={<Sparkles className="h-4 w-4" />}>
            <div id="ai-summary" className="border-brand-100 bg-brand-50/40 rounded-lg border p-4">
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
              <p className="text-xs text-gray-400">Generated {aiSummaryAt.toLocaleTimeString()}</p>
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
                    (clinical?.alerts ?? []).map((a) => a.label).join(", ") || "No active alerts."
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
          </CollapsibleSection>

          {/* Section 12 — Audit Information */}
          <CollapsibleSection title="Audit Information" icon={<History className="h-4 w-4" />}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <AuditItem label="Created By" value={patient.created_by} mono />
              <AuditItem label="Created On" value={formatDate(patient.created_at)} />
              <AuditItem label="Last Updated" value={formatDate(patient.updated_at)} />
              <AuditItem label="Updated By" value="—" />
            </dl>
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

function SummaryItem({
  label,
  value,
  mono = false,
  truncate = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`text-sm text-gray-900 ${mono ? "font-mono text-xs" : ""} ${truncate ? "max-w-[200px] truncate" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function MedicationField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={inputClass}
      />
    </div>
  );
}

function NoteField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        rows={2}
        className={inputClass}
      />
    </div>
  );
}

function AppointmentStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-xs font-bold text-gray-400">{label}</span>
      <p className="flex-1 text-gray-700">{value}</p>
    </div>
  );
}

function AiSummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="mt-0.5 text-gray-800">{value}</p>
    </div>
  );
}

function AuditItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
