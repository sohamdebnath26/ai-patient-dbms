import { useState, useRef, useCallback, useEffect } from "react";
import type { Medication, MedicationInput } from "@domain/patient";
import type { IMedicationSuggestionService } from "@application/ports/IMedicationSuggestionService";
import type {
  MedicationSuggestion,
  DosageOption,
  FrequencyOption,
  RouteOption,
} from "@domain/patient/MedicationSuggestion";
import { Pill, Loader2, Plus, Trash2, Search, X } from "lucide-react";
import { SectionHeading } from "./helpers";
import { formatDate, inputClass } from "./utils";

interface MedicationSectionProps {
  medications: Medication[];
  adding: boolean;
  onAdd: (input: MedicationInput) => void;
  onRemove: (id: string) => void;
  suggestionService?: IMedicationSuggestionService;
  prescribingDoctor?: string;
}

const emptyDraft = {
  medication_name: "",
  dosage: "",
  frequency: "",
  route: "",
  duration: "",
  start_date: "",
  end_date: "",
  prescribing_doctor: "",
};

const COMMON_FREQUENCIES: string[] = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every other day",
  "Once weekly",
  "As needed",
  "At bedtime",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
];

const COMMON_ROUTES: string[] = [
  "Oral",
  "Topical",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
  "Sublingual",
  "Inhalation",
  "Ophthalmic",
  "Otic",
  "Rectal",
  "Vaginal",
  "Transdermal",
];

export function MedicationSection({
  medications,
  adding,
  onAdd,
  onRemove,
  suggestionService,
  prescribingDoctor,
}: MedicationSectionProps) {
  const [draft, setDraft] = useState(() => ({
    ...emptyDraft,
    prescribing_doctor: prescribingDoctor ?? "",
  }));
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [suggestionInstructions, setSuggestionInstructions] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<{
    dosages: DosageOption[];
    frequencies: FrequencyOption[];
    routes: RouteOption[];
    loadedFor: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasSuggestions = !!suggestionService;

  const doSearch = useCallback(
    (query: string) => {
      if (!suggestionService) return;
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setSearching(true);
      suggestionService
        .search(query.trim())
        .then((results) => {
          setSuggestions(results);
          setHighlightIdx(0);
          setShowSuggestions(results.length > 0);
        })
        .catch((err: unknown) => {
          console.error("Medication suggestion error:", err);
          setSuggestions([]);
          setShowSuggestions(false);
        })
        .finally(() => {
          setSearching(false);
        });
    },
    [suggestionService],
  );

  function handleMedicationNameChange(value: string) {
    setDraft((p) => ({ ...p, medication_name: value }));
    if (detailCache && detailCache.loadedFor !== value) {
      setDetailCache(null);
      setSuggestionInstructions(null);
    }
    if (!value) {
      setSuggestionInstructions(null);
      setDetailCache(null);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;

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
        handleSelectSuggestion(sel);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function handleSelectSuggestion(suggestion: MedicationSuggestion) {
    setDraft((p) => ({
      ...p,
      medication_name: suggestion.name,
    }));
    setShowSuggestions(false);
    setSuggestions([]);

    if (suggestionService) {
      suggestionService
        .getDetail(suggestion.id)
        .then((detail) => {
          if (!detail) return;
          const dosages: DosageOption[] = detail.dosageOptions;
          const frequencies: FrequencyOption[] = detail.frequencyOptions;

          setDraft((p) => {
            const updated = { ...p };
            if (dosages.length === 1) {
              updated.dosage = dosages[0]?.value ?? p.dosage;
            } else if (dosages.length > 1) {
              updated.dosage = "";
            }
            if (frequencies.length === 1) {
              updated.frequency = frequencies[0]?.value ?? p.frequency;
            } else if (frequencies.length > 1) {
              updated.frequency = "";
            }
            return updated;
          });

          setDetailCache({
            dosages,
            frequencies,
            routes: detail.routeOptions,
            loadedFor: suggestion.id,
          });

          if (detail.instructions) {
            setSuggestionInstructions(detail.instructions);
          }
        })
        .catch(() => {
          /* ignore */
        });
    }
  }

  const dosageOptions: DosageOption[] = detailCache?.dosages ?? [];
  const frequencyOptions: (FrequencyOption & { label: string; value: string })[] =
    detailCache?.frequencies ?? COMMON_FREQUENCIES.map((f) => ({ value: f, label: f }));
  const routeOptions: (RouteOption & { label: string; value: string })[] =
    detailCache?.routes ?? COMMON_ROUTES.map((r) => ({ value: r, label: r }));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleAdd() {
    if (!draft.medication_name.trim()) return;
    onAdd({
      medication_name: draft.medication_name.trim(),
      dosage: draft.dosage || undefined,
      frequency: draft.frequency || undefined,
      route: draft.route || undefined,
      duration: draft.duration || undefined,
      start_date: draft.start_date || undefined,
      end_date: draft.end_date || undefined,
      prescribing_doctor: draft.prescribing_doctor || undefined,
    });
    setDraft({ ...emptyDraft, prescribing_doctor: prescribingDoctor ?? "" });
    setDetailCache(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionInstructions(null);
  }

  return (
    <div className="space-y-4">
      <SectionHeading
        icon={<Pill className="h-4 w-4" />}
        title="Medications"
        badge={
          medications.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {medications.length}
            </span>
          ) : undefined
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="px-2 py-2 font-medium">Medication</th>
              <th className="px-2 py-2 font-medium">Dose</th>
              <th className="px-2 py-2 font-medium">Route</th>
              <th className="px-2 py-2 font-medium">Frequency</th>
              <th className="px-2 py-2 font-medium">Duration</th>
              <th className="px-2 py-2 font-medium">Start</th>
              <th className="px-2 py-2 font-medium">End</th>
              <th className="px-2 py-2 font-medium">Prescribing Doctor</th>
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medications.map((m) => (
              <tr key={m.id}>
                <td className="px-2 py-2 font-medium text-gray-900">{m.medication_name}</td>
                <td className="px-2 py-2 text-gray-600">{m.dosage || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{m.route || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{m.frequency || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{m.duration || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{formatDate(m.start_date)}</td>
                <td className="px-2 py-2 text-gray-600">{formatDate(m.end_date)}</td>
                <td className="px-2 py-2 text-gray-600">{m.prescribing_doctor || "—"}</td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      onRemove(m.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {medications.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2 py-4 text-center text-gray-400">
                  No medications recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Plus className="h-3.5 w-3.5" /> Add Medication
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={draft.medication_name}
                onChange={(e) => {
                  handleMedicationNameChange(e.target.value);
                }}
                onFocus={() => {
                  if (suggestionService && draft.medication_name.trim().length >= 2) {
                    doSearch(draft.medication_name);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={hasSuggestions ? "Search medicine..." : "Enter medicine name"}
                className={`${inputClass} pl-8`}
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-haspopup="listbox"
              />
              {searching && (
                <Loader2 className="absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gray-400" />
              )}
              {draft.medication_name && !searching && (
                <button
                  type="button"
                  onClick={() => {
                    handleMedicationNameChange("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setHighlightIdx(0);
                  }}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      handleSelectSuggestion(s);
                    }}
                    onMouseEnter={() => {
                      setHighlightIdx(i);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      i === highlightIdx ? "bg-brand-50 text-brand-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span className="font-medium text-gray-900">{s.name}</span>
                    {s.genericName && (
                      <span className="text-xs text-gray-400">{s.genericName}</span>
                    )}
                    {s.category && (
                      <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {s.category}
                      </span>
                    )}
                  </button>
                ))}
                {draft.medication_name.trim().length >= 2 &&
                  !suggestions.some(
                    (s) => s.name.toLowerCase() === draft.medication_name.trim().toLowerCase(),
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = draft.medication_name.trim();
                        setDraft((p) => ({ ...p, medication_name: name }));
                        setShowSuggestions(false);
                        setSuggestions([]);
                      }}
                      className="text-brand-600 hover:bg-brand-50 flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add &quot;{draft.medication_name.trim()}&quot; as new medicine</span>
                    </button>
                  )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Dosage</label>
            {dosageOptions.length > 0 ? (
              <select
                value={draft.dosage}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, dosage: e.target.value }));
                }}
                className={inputClass}
              >
                <option value="">Select dosage</option>
                {dosageOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
                <option value="__other__">Other (freetext)</option>
              </select>
            ) : (
              <input
                type="text"
                value={draft.dosage}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, dosage: e.target.value }));
                }}
                placeholder="e.g. 500mg, 10mg"
                className={inputClass}
              />
            )}
            {draft.dosage === "__other__" && (
              <input
                type="text"
                value=""
                onChange={(e) => {
                  setDraft((p) => ({ ...p, dosage: e.target.value }));
                }}
                placeholder="Specify dosage"
                className={`${inputClass} mt-1`}
                autoFocus
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Route</label>
            {routeOptions.length > 0 ? (
              <select
                value={draft.route}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, route: e.target.value }));
                }}
                className={inputClass}
              >
                <option value="">Select route</option>
                {routeOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={draft.route}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, route: e.target.value }));
                }}
                className={inputClass}
              >
                <option value="">Select route</option>
                {COMMON_ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Frequency</label>
            {frequencyOptions.length > 0 ? (
              <select
                value={draft.frequency}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, frequency: e.target.value }));
                }}
                className={inputClass}
              >
                <option value="">Select frequency</option>
                {frequencyOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={draft.frequency}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, frequency: e.target.value }));
                }}
                className={inputClass}
              >
                <option value="">Select frequency</option>
                {COMMON_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Duration</label>
            <input
              type="text"
              value={draft.duration}
              onChange={(e) => {
                setDraft((p) => ({ ...p, duration: e.target.value }));
              }}
              placeholder="e.g. 7 days, 2 weeks"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Start Date</label>
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) => {
                setDraft((p) => ({ ...p, start_date: e.target.value }));
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">End Date</label>
            <input
              type="date"
              value={draft.end_date}
              onChange={(e) => {
                setDraft((p) => ({ ...p, end_date: e.target.value }));
              }}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Prescribing Doctor
            </label>
            <input
              type="text"
              value={draft.prescribing_doctor}
              onChange={(e) => {
                setDraft((p) => ({ ...p, prescribing_doctor: e.target.value }));
              }}
              placeholder="Doctor who prescribed this medication"
              className={inputClass}
            />
          </div>

          {suggestionInstructions && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 sm:col-span-3">
              <p className="text-[11px] font-semibold tracking-wide text-blue-700 uppercase">
                Instructions from dataset
              </p>
              <p className="mt-1 text-sm text-blue-800">{suggestionInstructions}</p>
            </div>
          )}

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.medication_name.trim() || adding}
              className="bg-brand-600 hover:bg-brand-700 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Medication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
