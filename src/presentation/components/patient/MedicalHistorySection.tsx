import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { HeartPulse, Plus, X } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import {
  SKIN_DISEASE_OPTIONS,
  SURGERY_OPTIONS,
  CHRONIC_CONDITION_OPTIONS,
} from "./data/clinical-options";

function MultiSelectChips({
  label,
  options,
  selected,
  onToggle,
  otherValue,
  onOtherChange,
  otherPlaceholder,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  otherPlaceholder: string;
}) {
  const [showOther, setShowOther] = useState(false);

  return (
    <div>
      <label className={labelClass}>{label}</label>
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
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {isSelected && <X className="mr-1 h-3 w-3" />}
              {opt}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setShowOther(!showOther);
          }}
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            showOther
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
          }`}
        >
          {showOther ? <X className="mr-1 h-3 w-3" /> : <Plus className="mr-1 h-3 w-3" />}
          Other
        </button>
      </div>
      {showOther && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => {
            onOtherChange(e.target.value);
          }}
          placeholder={otherPlaceholder}
          className={`${inputClass} mt-2`}
        />
      )}
    </div>
  );
}

function joinValues(selected: string[], other: string): string {
  const all = [...selected];
  if (other.trim()) all.push(other.trim());
  return all.join(", ");
}

function parseKnown(s: string | undefined | null, knowns: readonly string[]): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((p) => p.trim())
    .filter((p) => knowns.includes(p));
}

function parseOther(s: string | undefined | null, knowns: readonly string[]): string {
  if (!s) return "";
  return s
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !knowns.includes(p))
    .join(", ");
}

export function MedicalHistorySection() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<PatientFormInput>();

  const skinDiseasesVal = watch("previous_skin_diseases") as string | undefined | null;
  const surgeriesVal = watch("previous_surgeries") as string | undefined | null;
  const otherConditionsVal = watch("other_medical_conditions") as string | undefined | null;
  const hasCancer = watch("previous_skin_cancer") as boolean | undefined | null;

  const parsed = useRef(false);

  const [selectedSkinDiseases, setSelectedSkinDiseases] = useState<string[]>([]);
  const [otherSkinDisease, setOtherSkinDisease] = useState("");
  const [selectedSurgeries, setSelectedSurgeries] = useState<string[]>([]);
  const [otherSurgery, setOtherSurgery] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState("");

  const syncing = useRef(false);

  useEffect(() => {
    if (parsed.current) return;
    const anyValPresent = skinDiseasesVal || surgeriesVal || otherConditionsVal;
    if (!anyValPresent) return;
    parsed.current = true;
    syncing.current = true;
    setSelectedSkinDiseases(parseKnown(skinDiseasesVal, SKIN_DISEASE_OPTIONS));
    setOtherSkinDisease(parseOther(skinDiseasesVal, SKIN_DISEASE_OPTIONS));
    setSelectedSurgeries(parseKnown(surgeriesVal, SURGERY_OPTIONS));
    setOtherSurgery(parseOther(surgeriesVal, SURGERY_OPTIONS));
    setSelectedConditions(parseKnown(otherConditionsVal, CHRONIC_CONDITION_OPTIONS));
    setOtherCondition(parseOther(otherConditionsVal, CHRONIC_CONDITION_OPTIONS));
    syncing.current = false;
  }, [skinDiseasesVal, surgeriesVal, otherConditionsVal]);

  useEffect(() => {
    if (syncing.current || !parsed.current) return;
    const val = joinValues(selectedSkinDiseases, otherSkinDisease);
    setValue("previous_skin_diseases", val || "", { shouldValidate: false });
  }, [selectedSkinDiseases, otherSkinDisease, setValue]);

  useEffect(() => {
    if (syncing.current || !parsed.current) return;
    const val = joinValues(selectedSurgeries, otherSurgery);
    setValue("previous_surgeries", val || "", { shouldValidate: false });
  }, [selectedSurgeries, otherSurgery, setValue]);

  useEffect(() => {
    if (syncing.current || !parsed.current) return;
    const val = joinValues(selectedConditions, otherCondition);
    setValue("other_medical_conditions", val || "", { shouldValidate: false });
  }, [selectedConditions, otherCondition, setValue]);

  return (
    <div className="space-y-5">
      <SectionHeading icon={<HeartPulse className="h-4 w-4" />} title="Medical History" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Chief Complaint <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("chief_complaint")}
            rows={2}
            placeholder="Primary reason for this visit"
            className={inputClass}
          />
          <FieldError message={errors.chief_complaint?.message} />
        </div>
        <div>
          <label className={labelClass}>
            Present Illness <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("present_illness")}
            rows={2}
            placeholder="History of present illness"
            className={inputClass}
          />
          <FieldError message={errors.present_illness?.message} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <MultiSelectChips
          label="Previous Skin Diseases"
          options={SKIN_DISEASE_OPTIONS}
          selected={selectedSkinDiseases}
          onToggle={(val) => {
            setSelectedSkinDiseases((prev) =>
              prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
            );
          }}
          otherValue={otherSkinDisease}
          onOtherChange={setOtherSkinDisease}
          otherPlaceholder="Specify other skin disease"
        />
      </div>

      <div>
        <MultiSelectChips
          label="Previous Surgeries"
          options={SURGERY_OPTIONS}
          selected={selectedSurgeries}
          onToggle={(val) => {
            setSelectedSurgeries((prev) =>
              prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
            );
          }}
          otherValue={otherSurgery}
          onOtherChange={setOtherSurgery}
          otherPlaceholder="Specify other surgery"
        />
      </div>

      <div>
        <MultiSelectChips
          label="Other Medical Conditions"
          options={CHRONIC_CONDITION_OPTIONS}
          selected={selectedConditions}
          onToggle={(val) => {
            setSelectedConditions((prev) =>
              prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
            );
          }}
          otherValue={otherCondition}
          onOtherChange={setOtherCondition}
          otherPlaceholder="Specify other condition"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            {...register("previous_skin_cancer")}
            className="text-brand-600 focus:ring-brand-500 h-4 w-4 rounded border-gray-300"
          />
          Previous Skin Cancer
        </label>
        {hasCancer && (
          <input
            {...register("medical_notes")}
            placeholder="Type of skin cancer, year, treatment details"
            className={`${inputClass} min-w-[200px] flex-1`}
          />
        )}
      </div>
    </div>
  );
}
