import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { Stethoscope, X, Plus, Trash2 } from "lucide-react";
import { SectionHeading } from "./helpers";
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

interface Assessment {
  id: string;
  bodyArea: string;
  finding: string;
  severity: string;
  onsetDate: string;
  duration: string;
  symptoms: string;
  morphology: string;
  distribution: string;
}

let nextId = 1;
function generateId(): string {
  return `a_${Date.now()}_${nextId++}`;
}

const DEFAULT_ASSESSMENT: Assessment = {
  id: "",
  bodyArea: "",
  finding: "",
  severity: "",
  onsetDate: "",
  duration: "",
  symptoms: "",
  morphology: "",
  distribution: "",
};

function parseAssessments(raw: string | undefined | null): Assessment[] {
  if (!raw) return [{ ...DEFAULT_ASSESSMENT, id: generateId() }];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((a: Record<string, unknown>) => ({
        id: typeof a.id === "string" && a.id ? a.id : generateId(),
        bodyArea: typeof a.bodyArea === "string" ? a.bodyArea : "",
        finding: typeof a.finding === "string" ? a.finding : "",
        severity: typeof a.severity === "string" ? a.severity : "",
        onsetDate: typeof a.onsetDate === "string" ? a.onsetDate : "",
        duration: typeof a.duration === "string" ? a.duration : "",
        symptoms: typeof a.symptoms === "string" ? a.symptoms : "",
        morphology: typeof a.morphology === "string" ? a.morphology : "",
        distribution: typeof a.distribution === "string" ? a.distribution : "",
      }));
    }
  } catch {
    // fall through
  }
  return [{ ...DEFAULT_ASSESSMENT, id: generateId() }];
}

function serializeAssessments(assessments: Assessment[]): string {
  return JSON.stringify(assessments);
}

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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchFn: (query: string) => { regionId: string; label: string; category: string; side?: Side }[];
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
      <label className={labelClass}>{label}</label>
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
    </div>
  );
}

function computeDurationFromOnset(onsetDate: string): string {
  if (!onsetDate) return "";
  const onset = new Date(onsetDate);
  if (isNaN(onset.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - onset.getFullYear();
  let months = now.getMonth() - onset.getMonth();
  let days = now.getDate() - onset.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  if (parts.length === 0) {
    if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
    return "Today";
  }
  return parts.join(", ");
}

function AssessmentCard({
  index,
  assessment,
  onChange,
  onRemove,
}: {
  index: number;
  assessment: Assessment;
  onChange: (updated: Assessment) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Assessment {index + 1}</h4>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="Remove assessment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="space-y-4">
        <SearchableTagInput
          label="Body Area"
          value={assessment.bodyArea}
          onChange={(v) => {
            onChange({ ...assessment, bodyArea: v });
          }}
          placeholder="Search anatomical region..."
          searchFn={getBodyRegionSearchResults}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Finding / Lesion <span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={assessment.finding}
              onChange={(e) => {
                onChange({ ...assessment, finding: e.target.value });
              }}
              placeholder="e.g. Plaque psoriasis, Nodular BCC"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Severity</label>
            <select
              value={assessment.severity}
              onChange={(e) => {
                onChange({ ...assessment, severity: e.target.value });
              }}
              className={inputClass}
            >
              <option value="">Select severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Onset Date</label>
            <input
              type="date"
              value={assessment.onsetDate}
              onChange={(e) => {
                const onsetDate = e.target.value;
                const autoDuration = computeDurationFromOnset(onsetDate);
                onChange({
                  ...assessment,
                  onsetDate,
                  duration: autoDuration || assessment.duration,
                });
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Duration</label>
            <input
              type="text"
              value={assessment.duration}
              onChange={(e) => {
                onChange({ ...assessment, duration: e.target.value });
              }}
              placeholder="e.g. 6 months"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TagInput
            label="Symptoms"
            value={assessment.symptoms}
            onChange={(v) => {
              onChange({ ...assessment, symptoms: v });
            }}
            placeholder="e.g. itching, burning, pain"
            suggestions={SYMPTOM_OPTIONS}
          />
          <TagInput
            label="Morphology"
            value={assessment.morphology}
            onChange={(v) => {
              onChange({ ...assessment, morphology: v });
            }}
            placeholder="e.g. papules, plaques, vesicles"
            suggestions={MORPHOLOGY_OPTIONS}
          />
          <TagInput
            label="Distribution"
            value={assessment.distribution}
            onChange={(v) => {
              onChange({ ...assessment, distribution: v });
            }}
            placeholder="e.g. localized, bilateral, generalized"
            suggestions={DISTRIBUTION_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

export function DermatologySection() {
  const { register, setValue, watch } = useFormContext<PatientFormInput>();

  const familyHistoryVal = watch("family_history");

  const [assessments, setAssessments] = useState<Assessment[]>(() =>
    parseAssessments(familyHistoryVal),
  );
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && familyHistoryVal !== undefined) {
      initializedRef.current = true;
      setAssessments(parseAssessments(familyHistoryVal));
    }
  }, [familyHistoryVal]);

  useEffect(() => {
    if (initializedRef.current) {
      setValue("family_history", serializeAssessments(assessments), { shouldValidate: false });
    }
  }, [assessments, setValue]);

  function handleUpdate(id: string, updated: Assessment) {
    setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  function handleRemove(id: string) {
    setAssessments((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((a) => a.id !== id);
    });
  }

  function handleAdd() {
    setAssessments((prev) => [...prev, { ...DEFAULT_ASSESSMENT, id: generateId() }]);
  }

  return (
    <div className="space-y-6">
      <SectionHeading icon={<Stethoscope className="h-4 w-4" />} title="Dermatology Assessment" />

      <div className="space-y-4">
        {assessments.map((a, i) => (
          <AssessmentCard
            key={a.id}
            index={i}
            assessment={a}
            onChange={(updated) => {
              handleUpdate(a.id, updated);
            }}
            onRemove={
              assessments.length > 1
                ? () => {
                    handleRemove(a.id);
                  }
                : undefined
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        Add Assessment
      </button>

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
