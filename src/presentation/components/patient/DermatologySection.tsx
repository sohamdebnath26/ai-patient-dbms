import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { Stethoscope } from "lucide-react";
import { FieldError } from "./helpers";
import { inputClass, labelClass } from "./utils";

const SYMPTOM_OPTIONS = [
  "itching",
  "pain",
  "burning",
  "bleeding",
  "discharge",
  "redness",
  "scaling",
  "swelling",
  "pigmentation",
  "dryness",
];

interface DermatologySectionProps {
  register: UseFormRegister<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
  symptoms: string;
  onSymptomsChange: (value: string) => void;
}

export function DermatologySection({
  register,
  errors,
  symptoms,
  onSymptomsChange,
}: DermatologySectionProps) {
  const selected = symptoms
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function toggleSymptom(symptom: string) {
    const has = selected.includes(symptom);
    const next = has ? selected.filter((s) => s !== symptom) : [...selected, symptom];
    onSymptomsChange(next.join(", "));
  }

  return (
    <CollapsibleSection title="Dermatology Assessment" icon={<Stethoscope className="h-4 w-4" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Primary Diagnosis *</label>
          <input {...register("primary_diagnosis")} className={inputClass} />
          <FieldError message={errors.primary_diagnosis?.message} />
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
          <label className={labelClass}>Date of Onset *</label>
          <input type="date" {...register("date_of_onset")} className={inputClass} />
          <FieldError message={errors.date_of_onset?.message} />
        </div>
        <div>
          <label className={labelClass}>Duration</label>
          <input {...register("duration")} placeholder="e.g. 6 months" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Affected Body Areas</label>
          <input
            {...register("affected_body_areas")}
            placeholder="e.g. Face, Scalp, Trunk, Arms"
            className={inputClass}
          />
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
          <label className={labelClass}>Symptoms *</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((symptom) => {
              const isSelected = selected.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => {
                    toggleSymptom(symptom);
                  }}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                    isSelected
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.symptoms?.message} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Sun Exposure History</label>
          <textarea
            {...register("sun_exposure_history")}
            rows={2}
            placeholder="Chronic/occupational sun exposure, sunburns, tanning bed use"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Cosmetic Product Usage</label>
          <textarea
            {...register("cosmetic_product_usage")}
            rows={2}
            placeholder="Recent or ongoing use of cosmetics, skin products"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Occupational Exposure</label>
          <textarea
            {...register("occupational_exposure")}
            rows={2}
            placeholder="Chemical, allergen, or irritant exposure at work"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea {...register("medical_notes")} rows={3} className={inputClass} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
