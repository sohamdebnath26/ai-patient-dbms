import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { Stethoscope } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import {
  SYMPTOM_OPTIONS,
  SKIN_TYPE_OPTIONS,
  SUN_EXPOSURE_OPTIONS,
  COSMETIC_OPTIONS,
  OCCUPATIONAL_OPTIONS,
} from "./data/clinical-options";

function ChipSelector({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onToggle(opt);
              }}
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                isSelected
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onToggle(opt.value);
              }}
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DermatologySection() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<PatientFormInput>();

  const symptomsVal = watch("symptoms");
  const sunExposureVal = watch("sun_exposure_history") ?? "";
  const cosmeticVal = watch("cosmetic_product_usage") ?? "";
  const occupationalVal = watch("occupational_exposure") ?? "";

  const selectedSymptoms = symptomsVal
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const selectedSunExposure = sunExposureVal
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedCosmetic = cosmeticVal
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedOccupational = occupationalVal
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function toggleSymptoms(symptom: string) {
    const has = selectedSymptoms.includes(symptom);
    const next = has
      ? selectedSymptoms.filter((s) => s !== symptom)
      : [...selectedSymptoms, symptom];
    setValue("symptoms", next.join(", "), { shouldValidate: true });
  }

  function toggleSunExposure(val: string) {
    const has = selectedSunExposure.includes(val);
    const next = has ? selectedSunExposure.filter((s) => s !== val) : [...selectedSunExposure, val];
    setValue("sun_exposure_history", next.join(", "), { shouldValidate: false });
  }

  function toggleCosmetic(val: string) {
    const has = selectedCosmetic.includes(val);
    const next = has ? selectedCosmetic.filter((s) => s !== val) : [...selectedCosmetic, val];
    setValue("cosmetic_product_usage", next.join(", "), { shouldValidate: false });
  }

  function toggleOccupational(val: string) {
    const has = selectedOccupational.includes(val);
    const next = has
      ? selectedOccupational.filter((s) => s !== val)
      : [...selectedOccupational, val];
    setValue("occupational_exposure", next.join(", "), { shouldValidate: false });
  }

  return (
    <div className="space-y-5">
      <SectionHeading icon={<Stethoscope className="h-4 w-4" />} title="Dermatology Assessment" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Primary Diagnosis <span className="text-red-500">*</span>
          </label>
          <input
            {...register("primary_diagnosis")}
            className={inputClass}
            placeholder="Current clinical diagnosis"
          />
          <FieldError message={errors.primary_diagnosis?.message} />
        </div>
        <div>
          <label className={labelClass}>Secondary Diagnosis</label>
          <input
            {...register("secondary_diagnosis")}
            className={inputClass}
            placeholder="Secondary/supporting diagnosis"
          />
        </div>
        <div>
          <label className={labelClass}>Skin Type (Fitzpatrick)</label>
          <select {...register("skin_type")} className={inputClass}>
            <option value="">Select skin type</option>
            {SKIN_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Disease Severity</label>
          <select {...register("disease_severity")} className={inputClass}>
            <option value="">Select severity</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Date of Onset <span className="text-red-500">*</span>
          </label>
          <input type="date" {...register("date_of_onset")} className={inputClass} />
          <FieldError message={errors.date_of_onset?.message} />
        </div>
        <div>
          <label className={labelClass}>Duration</label>
          <input
            {...register("duration")}
            placeholder="e.g. 6 months, 2 years"
            className={inputClass}
          />
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
              className="text-brand-600 focus:ring-brand-500 h-4 w-4 rounded border-gray-300"
            />
            Current Flare
          </label>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <ChipSelector
          label="Symptoms"
          options={SYMPTOM_OPTIONS}
          selected={selectedSymptoms}
          onToggle={toggleSymptoms}
        />
        <FieldError message={errors.symptoms?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MultiSelectDropdown
          label="Sun Exposure History"
          options={SUN_EXPOSURE_OPTIONS}
          selected={selectedSunExposure}
          onToggle={toggleSunExposure}
        />
        <input type="hidden" {...register("sun_exposure_history")} />

        <MultiSelectDropdown
          label="Cosmetic Product Usage"
          options={COSMETIC_OPTIONS}
          selected={selectedCosmetic}
          onToggle={toggleCosmetic}
        />
        <input type="hidden" {...register("cosmetic_product_usage")} />
      </div>

      <MultiSelectDropdown
        label="Occupational Exposure"
        options={OCCUPATIONAL_OPTIONS}
        selected={selectedOccupational}
        onToggle={toggleOccupational}
      />
      <input type="hidden" {...register("occupational_exposure")} />
    </div>
  );
}
