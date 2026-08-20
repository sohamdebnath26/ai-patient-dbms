import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapPin, Search, ChevronDown, Loader2, Check } from "lucide-react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import { COUNTRIES } from "./data/countries";
import { INDIAN_STATES } from "./data/indianStates";

interface PatientAddressSectionProps {
  register: UseFormRegister<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
  setValue: UseFormSetValue<PatientFormInput>;
  watch: UseFormWatch<PatientFormInput>;
}

function SearchableCountrySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightIndexRef = useRef(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [search]);

  useEffect(() => {
    highlightIndexRef.current = 0;
  }, [filtered]);

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightIndexRef.current = Math.min(highlightIndexRef.current + 1, filtered.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightIndexRef.current = Math.max(highlightIndexRef.current - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlightIndexRef.current];
      if (item) {
        onChange(item.name);
        setOpen(false);
        setSearch("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    if (open && highlightIndexRef.current >= 0) {
      const el = document.getElementById(`country-option-${highlightIndexRef.current}`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, filtered]);

  const selectedCountry = COUNTRIES.find((c) => c.name === value);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value}
          placeholder="Search country..."
          className={`${inputClass} ${error ? "border-red-500" : ""} pr-8 pl-9`}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          onChange={(e) => {
            if (!open) setOpen(true);
            setSearch(e.target.value);
            if (!e.target.value) onChange("");
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        <ChevronDown
          className={`absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No countries found</li>
          ) : (
            filtered.map((country, i) => {
              const isSelected = country.name === selectedCountry?.name;
              const isHighlighted = i === highlightIndexRef.current;
              return (
                <li
                  key={country.code}
                  id={`country-option-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                    isHighlighted ? "bg-brand-50 text-brand-700" : isSelected ? "bg-gray-50" : ""
                  } hover:bg-brand-50 hover:text-brand-700`}
                  onMouseEnter={() => {
                    highlightIndexRef.current = i;
                  }}
                  onClick={() => {
                    onChange(country.name);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{flagEmoji(country.code)}</span>
                    {country.name}
                  </span>
                  {isSelected && <Check className="text-brand-600 h-4 w-4" />}
                </li>
              );
            })
          )}
        </ul>
      )}
      {error && <FieldError message={error} />}
    </div>
  );
}

function flagEmoji(code: string): string {
  if (code.length !== 2) return "🏳";
  const base = 0x1f1e6;
  const a = code.charCodeAt(0) - 65 + base;
  const b = code.charCodeAt(1) - 65 + base;
  return String.fromCodePoint(a, b);
}

function useIndianPinLookup(setValue: UseFormSetValue<PatientFormInput>) {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastLookedUpRef = useRef<string | null>(null);

  const lookup = useCallback(
    (pinCode: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const code = pinCode.trim();
      if (!code || !/^\d{6}$/.test(code)) {
        setLoading(false);
        return;
      }

      if (code === lastLookedUpRef.current) return;
      lastLookedUpRef.current = code;

      setLoading(true);

      timerRef.current = setTimeout(() => {
        if (abortRef.current) abortRef.current.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(code)}`, {
          signal: controller.signal,
        })
          .then(
            (res) =>
              res.json() as Promise<
                Array<{
                  Status: string;
                  PostOffice?: Array<{ Name: string; District: string; State: string }>;
                }>
              >,
          )
          .then((data) => {
            if (controller.signal.aborted) return;
            const postOffice = data[0]?.PostOffice?.[0];
            if (postOffice) {
              setValue("city", postOffice.Name, { shouldValidate: false, shouldDirty: true });
              setValue("district", postOffice.District, {
                shouldValidate: false,
                shouldDirty: true,
              });
              setValue("state", postOffice.State, { shouldValidate: false, shouldDirty: true });
              setValue("country", "India", { shouldValidate: false, shouldDirty: true });
            }
            setLoading(false);
          })
          .catch((err: unknown) => {
            if (controller.signal.aborted) return;
            setLoading(false);
            if (err instanceof DOMException && err.name === "AbortError") return;
          });
      }, 500);
    },
    [setValue],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { loading, lookup };
}

export function PatientAddressSection({
  register,
  errors,
  setValue,
  watch,
}: PatientAddressSectionProps) {
  const country = watch("country");
  const postalCode = watch("postal_code");
  const addressLine1 = watch("address_line1");
  const addressLine2 = watch("address_line2");
  const landmark = watch("landmark");
  const city = watch("city");
  const district = watch("district");
  const state = watch("state");
  const isIndia = country.toLowerCase() === "india";

  const { loading: pinLoading, lookup: pinLookup } = useIndianPinLookup(setValue);

  useEffect(() => {
    if (isIndia) {
      pinLookup(postalCode);
    }
  }, [postalCode, isIndia, pinLookup]);

  useEffect(() => {
    if (!isIndia) {
      pinLookup("");
    }
  }, [isIndia, pinLookup]);

  const formattedAddress = useMemo(() => {
    const parts = [
      addressLine1,
      addressLine2,
      landmark,
      city,
      district,
      state,
      postalCode,
      country,
    ].filter(Boolean) as string[];
    return parts.length > 0 ? parts.join(", ") : "";
  }, [addressLine1, addressLine2, landmark, city, district, state, postalCode, country]);

  const formattedAddressMultiline = useMemo(() => {
    const lines = [
      addressLine1,
      addressLine2,
      landmark ? `Near ${landmark}` : null,
      city,
      district,
      [state, postalCode].filter(Boolean).join(" - "),
      country,
    ].filter(Boolean) as string[];
    return lines;
  }, [addressLine1, addressLine2, landmark, city, district, state, postalCode, country]);

  return (
    <div className="space-y-4">
      <SectionHeading icon={<MapPin className="h-4 w-4" />} title="Address" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>
            Country <span className="text-red-500">*</span>
          </label>
          <SearchableCountrySelect
            value={country}
            onChange={(val) => {
              setValue("country", val, { shouldValidate: true, shouldDirty: true });
              if (val !== "India") {
                setValue("district", "", { shouldValidate: false, shouldDirty: true });
              }
            }}
            error={errors.country?.message}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("address_line1")}
            className={`${inputClass} ${errors.address_line1 ? "border-red-500" : ""}`}
            placeholder="House/Flat No., Building, Street"
          />
          <FieldError message={errors.address_line1?.message} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Address Line 2</label>
          <input
            {...register("address_line2")}
            className={inputClass}
            placeholder="Apartment, Suite, Area"
          />
        </div>

        <div>
          <label className={labelClass}>Landmark</label>
          <input {...register("landmark")} className={inputClass} placeholder="Nearby landmark" />
        </div>

        <div>
          <label className={labelClass}>
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register("city")}
              className={`${inputClass} ${errors.city ? "border-red-500" : ""}`}
              placeholder="City"
            />
            {pinLoading && isIndia && (
              <Loader2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>
          {pinLoading && isIndia && (
            <p className="mt-1 text-xs text-gray-400">Looking up location from PIN code...</p>
          )}
          <FieldError message={errors.city?.message} />
        </div>

        {isIndia && (
          <div>
            <label className={labelClass}>District</label>
            <div className="relative">
              <input
                {...register("district")}
                className={inputClass}
                placeholder="District / County"
              />
              {pinLoading && (
                <Loader2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>
            {isIndia ? "State / UT" : "State / Province"} <span className="text-red-500">*</span>
          </label>
          {isIndia ? (
            <div className="relative">
              <select
                {...register("state")}
                className={`${inputClass} ${errors.state ? "border-red-500" : ""}`}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          ) : (
            <input
              {...register("state")}
              className={`${inputClass} ${errors.state ? "border-red-500" : ""}`}
              placeholder="State / Province"
            />
          )}
          <FieldError message={errors.state?.message} />
        </div>

        <div>
          <label className={labelClass}>
            Postal Code <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register("postal_code")}
              className={`${inputClass} ${errors.postal_code ? "border-red-500" : ""}`}
              placeholder={isIndia ? "6-digit PIN code" : "Postal / ZIP code"}
              inputMode={isIndia ? "numeric" : "text"}
              maxLength={isIndia ? 6 : undefined}
            />
            {pinLoading && isIndia && (
              <Loader2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>
          <FieldError message={errors.postal_code?.message} />
        </div>
      </div>

      {formattedAddress && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Formatted Address
          </p>
          <div className="space-y-0.5">
            {formattedAddressMultiline.map((line, i) => (
              <p key={i} className="text-sm text-gray-800">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
