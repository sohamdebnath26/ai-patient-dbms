import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { Stethoscope, X } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import { SYMPTOM_OPTIONS } from "./data/clinical-options";
import {
  getBodyRegionSearchResults,
  composeBodyRegionId,
  resolveCanonicalLabel,
  type Side,
  MORPHOLOGY_OPTIONS,
  DISTRIBUTION_OPTIONS,
} from "./data/body-regions";

interface TagInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: readonly string[];
  allowCustom?: boolean;
}

function TagInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  allowCustom = true,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const filtered = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.trim().toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      setOpen(false);
      return;
    }
    onChange([...tags, trimmed].join(", "));
    setInput("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag).join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) {
      if (e.key === "Enter" && input.trim() && allowCustom) {
        e.preventDefault();
        addTag(input);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((p) => Math.min(p + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) addTag(filtered[highlight]);
      else if (input.trim() && allowCustom) addTag(input);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>{label}</label>
      <div className="focus-within:border-brand-500 focus-within:ring-brand-500 mt-1 flex min-h-[38px] flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 focus-within:ring-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => {
                removeTag(tag);
              }}
              className="text-brand-400 hover:text-brand-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            setOpen(v.trim().length >= 1);
            setHighlight(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-44 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                addTag(s);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                i === highlight ? "bg-brand-50 text-brand-700" : "hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchableTagInput({
  label,
  value,
  onChange,
  placeholder,
  searchFn,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchFn: (query: string) => { regionId: string; label: string; category: string; side?: Side }[];
  required?: boolean;
  error?: string;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const regions = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const filtered = input.trim().length >= 1 ? searchFn(input) : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function addRegion(regionId: string, side?: Side) {
    const canonicalId = composeBodyRegionId(regionId, side);
    if (regions.includes(canonicalId)) {
      setInput("");
      setOpen(false);
      return;
    }
    onChange([...regions, canonicalId].join(", "));
    setInput("");
    setOpen(false);
  }

  function removeRegion(canonicalId: string) {
    onChange(regions.filter((r) => r !== canonicalId).join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((p) => Math.min(p + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = filtered[highlight];
      if (sel) addRegion(sel.regionId, sel.side);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="focus-within:border-brand-500 focus-within:ring-brand-500 mt-1 flex min-h-[38px] flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 focus-within:ring-1">
        {regions.map((canonicalId) => {
          const label = resolveCanonicalLabel(
            canonicalId.replace(/^(left_|right_|bilateral_)/, ""),
            canonicalId.startsWith("left_")
              ? "left"
              : canonicalId.startsWith("right_")
                ? "right"
                : canonicalId.startsWith("bilateral_")
                  ? "bilateral"
                  : undefined,
          );
          return (
            <span
              key={canonicalId}
              className="bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
            >
              {label}
              <button
                type="button"
                onClick={() => {
                  removeRegion(canonicalId);
                }}
                className="text-brand-400 hover:text-brand-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            setOpen(v.trim().length >= 1);
            setHighlight(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={regions.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map(({ regionId, label, category, side }, i) => (
            <button
              key={composeBodyRegionId(regionId, side)}
              type="button"
              onClick={() => {
                addRegion(regionId, side);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                i === highlight ? "bg-brand-50 text-brand-700" : "hover:bg-gray-50"
              }`}
            >
              <span>{label}</span>
              <span className="ml-auto text-[11px] text-gray-400">{category}</span>
            </button>
          ))}
        </div>
      )}
      {error && <FieldError message={error} />}
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

  const bodyAreasVal = watch("affected_body_areas");
  const symptomsVal = watch("symptoms");
  const morphologyVal = watch("secondary_diagnosis");
  const distributionVal = watch("sun_exposure_history");

  return (
    <div className="space-y-6">
      <SectionHeading icon={<Stethoscope className="h-4 w-4" />} title="Dermatology Assessment" />

      <div className="grid gap-5 md:grid-cols-2">
        <SearchableTagInput
          label="Body Area"
          value={bodyAreasVal}
          onChange={(v) => {
            setValue("affected_body_areas", v, { shouldValidate: false });
          }}
          placeholder="Search anatomical region..."
          searchFn={getBodyRegionSearchResults}
        />

        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              Finding / Lesion <span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              {...register("primary_diagnosis")}
              placeholder="e.g. Plaque psoriasis, Nodular BCC"
              className={inputClass}
            />
            <FieldError message={errors.primary_diagnosis?.message} />
          </div>

          <div>
            <label className={labelClass}>Severity</label>
            <select {...register("disease_severity")} className={inputClass}>
              <option value="">Select severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                Onset Date <span className="ml-0.5 text-red-500">*</span>
              </label>
              <input type="date" {...register("date_of_onset")} className={inputClass} />
              <FieldError message={errors.date_of_onset?.message} />
            </div>
            <div>
              <label className={labelClass}>Duration</label>
              <input {...register("duration")} placeholder="e.g. 6 months" className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <TagInput
            label="Symptoms"
            value={symptomsVal}
            onChange={(v) => {
              setValue("symptoms", v, { shouldValidate: true });
            }}
            placeholder="e.g. itching, burning, pain, tenderness"
            suggestions={SYMPTOM_OPTIONS}
          />
          <FieldError message={errors.symptoms?.message} />
        </div>

        <TagInput
          label="Morphology"
          value={morphologyVal ?? ""}
          onChange={(v) => {
            setValue("secondary_diagnosis", v, { shouldValidate: false });
          }}
          placeholder="e.g. papules, plaques, vesicles, scales"
          suggestions={MORPHOLOGY_OPTIONS}
        />

        <TagInput
          label="Distribution"
          value={distributionVal ?? ""}
          onChange={(v) => {
            setValue("sun_exposure_history", v, { shouldValidate: false });
          }}
          placeholder="e.g. localized, bilateral, flexural, generalized"
          suggestions={DISTRIBUTION_OPTIONS}
        />
      </div>

      <div>
        <label className={labelClass}>Clinical Notes</label>
        <textarea
          {...register("medical_notes")}
          rows={3}
          placeholder="Additional clinical observations..."
          className={inputClass}
        />
      </div>
    </div>
  );
}
