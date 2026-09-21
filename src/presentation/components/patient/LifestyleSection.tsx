import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { Activity, X } from "lucide-react";
import { SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";

const SUN_SUGGESTIONS = [
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

const ENVIRONMENTAL_SUGGESTIONS = [
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

const COSMETIC_SUGGESTIONS = [
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

interface TagInputProps {
  label: string;
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function TagInput({ label, suggestions, value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const filtered = input.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().includes(input.trim().toLowerCase()) && !tags.includes(s))
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

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      setShowDropdown(false);
      return;
    }
    onChange([...tags, trimmed].join(", "));
    setInput("");
    setShowDropdown(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag).join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (input.trim()) {
          addTag(input);
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
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>{label}</label>

      <div className="focus-within:border-brand-500 focus-within:ring-brand-500 mt-1 flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 focus-within:ring-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="border-brand-200 bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
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
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value.trim()) {
              setHighlightIdx(0);
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
          }}
          onFocus={() => {
            if (input.trim()) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
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
                i === highlightIdx ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
          {filtered.length === 0 && input.trim() && (
            <button
              type="button"
              onClick={() => {
                addTag(input.trim());
              }}
              className="text-brand-600 hover:bg-brand-50 flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm"
            >
              <span>+</span>
              <span>Add &quot;{input.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LifestyleSectionProps {
  gender: string;
}

export function LifestyleSection({ gender }: LifestyleSectionProps) {
  const { register, watch, setValue } = useFormContext<PatientFormInput>();
  const isFemale = gender.toLowerCase() === "female";

  const sunExposureVal = watch("sun_exposure_history") as string | undefined | null;
  const envExposureVal = watch("occupational_exposure") as string | undefined | null;
  const cosmeticVal = watch("cosmetic_product_usage") as string | undefined | null;

  return (
    <div className="space-y-5">
      <SectionHeading icon={<Activity className="h-4 w-4" />} title="Lifestyle &amp; Exposures" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Smoking Status</label>
          <select {...register("smoking_status")} className={inputClass}>
            <option value="">Select</option>
            <option value="never">Never</option>
            <option value="former">Former</option>
            <option value="current">Current</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Alcohol Consumption</label>
          <select {...register("alcohol_consumption")} className={inputClass}>
            <option value="">Select</option>
            <option value="none">None</option>
            <option value="occasional">Occasional</option>
            <option value="moderate">Moderate</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>
        {isFemale && (
          <div>
            <label className={labelClass}>Pregnancy Status</label>
            <select {...register("pregnancy_status")} className={inputClass}>
              <option value="">Select</option>
              <option value="not_pregnant">Not Pregnant</option>
              <option value="pregnant">Pregnant</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <TagInput
            label="Sun Exposure"
            suggestions={SUN_SUGGESTIONS}
            value={sunExposureVal ?? ""}
            onChange={(v) => {
              setValue("sun_exposure_history", v, { shouldValidate: false });
            }}
            placeholder="Search or type sun exposure..."
          />
        </div>
        <div className="sm:col-span-2">
          <TagInput
            label="Environmental Exposure"
            suggestions={ENVIRONMENTAL_SUGGESTIONS}
            value={envExposureVal ?? ""}
            onChange={(v) => {
              setValue("occupational_exposure", v, { shouldValidate: false });
            }}
            placeholder="Search or type environmental exposures..."
          />
        </div>
        <div className="sm:col-span-2">
          <TagInput
            label="Cosmetic &amp; Personal Care Products"
            suggestions={COSMETIC_SUGGESTIONS}
            value={cosmeticVal ?? ""}
            onChange={(v) => {
              setValue("cosmetic_product_usage", v, { shouldValidate: false });
            }}
            placeholder="Search or type cosmetic products..."
          />
        </div>
      </div>
    </div>
  );
}
