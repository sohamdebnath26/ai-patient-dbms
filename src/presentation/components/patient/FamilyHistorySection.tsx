import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { Users, Plus, X } from "lucide-react";
import { SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import {
  FAMILY_HISTORY_SKIN_OPTIONS,
  FAMILY_HISTORY_CANCER_OPTIONS,
} from "./data/clinical-options";

function SelectableChips({
  label,
  options,
  selected,
  onToggle,
  detailValue,
  onDetailChange,
  detailPlaceholder,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  detailValue: string;
  onDetailChange: (value: string) => void;
  detailPlaceholder: string;
}) {
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
            const label = prompt("Enter option:");
            if (label?.trim()) onToggle(label.trim());
          }}
          className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          <Plus className="mr-1 h-3 w-3" />
          Other
        </button>
      </div>
      {(detailValue || selected.length > 0) && (
        <textarea
          value={detailValue}
          onChange={(e) => {
            onDetailChange(e.target.value);
          }}
          placeholder={detailPlaceholder}
          rows={2}
          className={`${inputClass} mt-2`}
        />
      )}
    </div>
  );
}

export function FamilyHistorySection() {
  const { register, setValue, watch } = useFormContext<PatientFormInput>();

  const skinVal = watch("family_history_skin") as string | undefined | null;
  const cancerVal = watch("family_history_cancer") as string | undefined | null;

  const [selectedSkin, setSelectedSkin] = useState<string[]>(() => {
    if (!skinVal) return [];
    return skinVal
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });
  const [skinDetail, setSkinDetail] = useState("");

  const [selectedCancer, setSelectedCancer] = useState<string[]>(() => {
    if (!cancerVal) return [];
    return cancerVal
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });
  const [cancerDetail, setCancerDetail] = useState("");

  function updateSkin(sel: string[], detail: string) {
    setValue(
      "family_history_skin",
      detail ? `${sel.join(", ")} - ${detail}` : sel.join(", ") || "",
      { shouldValidate: false },
    );
  }

  function updateCancer(sel: string[], detail: string) {
    setValue(
      "family_history_cancer",
      detail ? `${sel.join(", ")} - ${detail}` : sel.join(", ") || "",
      { shouldValidate: false },
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading icon={<Users className="h-4 w-4" />} title="Family History" />

      <SelectableChips
        label="Family History of Skin Diseases"
        options={FAMILY_HISTORY_SKIN_OPTIONS}
        selected={selectedSkin}
        onToggle={(val) => {
          setSelectedSkin((prev) => {
            const next = prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val];
            updateSkin(next, skinDetail);
            return next;
          });
        }}
        detailValue={skinDetail}
        onDetailChange={(v) => {
          setSkinDetail(v);
          updateSkin(selectedSkin, v);
        }}
        detailPlaceholder="Relation and details (e.g. Father had melanoma at 55)"
      />
      <input type="hidden" {...register("family_history_skin")} />

      <SelectableChips
        label="Family History of Cancer"
        options={FAMILY_HISTORY_CANCER_OPTIONS}
        selected={selectedCancer}
        onToggle={(val) => {
          setSelectedCancer((prev) => {
            const next = prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val];
            updateCancer(next, cancerDetail);
            return next;
          });
        }}
        detailValue={cancerDetail}
        onDetailChange={(v) => {
          setCancerDetail(v);
          updateCancer(selectedCancer, v);
        }}
        detailPlaceholder="Relation and details (e.g. Mother had breast cancer at 60)"
      />
      <input type="hidden" {...register("family_history_cancer")} />
    </div>
  );
}
