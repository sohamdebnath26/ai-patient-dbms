import { useState, useEffect, useRef, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { HeartPulse, X, Search } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import {
  getCategorySuggestions,
  ensureCacheLoaded,
  learnTerm,
  type TermSuggestion,
} from "@infrastructure/supabase/clinical/learnedTerms";

interface TagInputProps {
  label: string;
  category: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function TagInput({ label, category, value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<TermSuggestion[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void ensureCacheLoaded();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateSuggestions = useCallback(
    (q: string) => {
      const results = getCategorySuggestions(category, q);
      setSuggestions(results);
      setHighlightIdx(0);
      setShowSuggestions(true);
    },
    [category],
  );

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      setShowSuggestions(false);
      return;
    }
    onChange([...tags, trimmed].join(", "));
    setInput("");
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag).join(", "));
  }

  function handleInputChange(val: string) {
    setInput(val);
    if (val.trim().length >= 1) {
      updateSuggestions(val);
    } else {
      setShowSuggestions(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && input.trim()) {
        e.preventDefault();
        addTag(input);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = suggestions[highlightIdx];
      if (sel) {
        addTag(sel.value);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>{label}</label>

      <div className="focus-within:border-brand-500 focus-within:ring-brand-500 mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 focus-within:ring-1">
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
            handleInputChange(e.target.value);
          }}
          onFocus={() => {
            if (input.trim().length >= 1) updateSuggestions(input);
          }}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                if (s.isLearned) {
                  void learnTerm(category, s.value).then(() => {
                    addTag(s.value);
                  });
                } else {
                  addTag(s.value);
                }
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                i === highlightIdx ? "bg-brand-50 text-brand-700" : "hover:bg-gray-50"
              }`}
            >
              <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span>{s.value}</span>
              {s.isLearned && <span className="ml-auto text-[10px] text-gray-400">learned</span>}
            </button>
          ))}
          {!suggestions.some((s) => s.value.toLowerCase() === input.trim().toLowerCase()) &&
            input.trim().length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  void learnTerm(category, input.trim()).then(() => {
                    addTag(input.trim());
                  });
                }}
                className="text-brand-600 hover:bg-brand-50 flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm"
              >
                <span className="text-brand-600">+</span>
                <span>Add &quot;{input.trim()}&quot; as new term</span>
              </button>
            )}
        </div>
      )}
    </div>
  );
}

export function MedicalHistorySection() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<PatientFormInput>();

  const skinDiseasesVal = watch("previous_skin_diseases") as string | undefined | null;
  const surgeriesVal = watch("previous_surgeries") as string | undefined | null;
  const otherConditionsVal = watch("other_medical_conditions") as string | undefined | null;
  const hasCancer = watch("previous_skin_cancer") as boolean | undefined | null;

  const { setValue } = useFormContext<PatientFormInput>();

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
        <TagInput
          label="Previous Skin Diseases"
          category="skin_disease"
          value={skinDiseasesVal ?? ""}
          onChange={(v) => {
            setValue("previous_skin_diseases", v, { shouldValidate: false });
          }}
          placeholder="Search or type skin diseases..."
        />
      </div>

      <div>
        <TagInput
          label="Previous Surgeries"
          category="surgery"
          value={surgeriesVal ?? ""}
          onChange={(v) => {
            setValue("previous_surgeries", v, { shouldValidate: false });
          }}
          placeholder="Search or type surgeries..."
        />
      </div>

      <div>
        <TagInput
          label="Other Medical Conditions"
          category="condition"
          value={otherConditionsVal ?? ""}
          onChange={(v) => {
            setValue("other_medical_conditions", v, { shouldValidate: false });
          }}
          placeholder="Search or type conditions..."
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
