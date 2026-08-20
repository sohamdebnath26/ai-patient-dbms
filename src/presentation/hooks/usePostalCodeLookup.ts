import { useEffect, useRef, useState, useCallback } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";

interface PostalLookupResult {
  city: string;
  state: string;
  country: string;
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "united states": "us",
  "united states of america": "us",
  usa: "us",
  "united kingdom": "gb",
  uk: "gb",
  "great britain": "gb",
  england: "gb",
  canada: "ca",
  australia: "au",
  india: "in",
  germany: "de",
  deutschland: "de",
  france: "fr",
  italy: "it",
  italia: "it",
  spain: "es",
  españa: "es",
  espana: "es",
  netherlands: "nl",
  "the netherlands": "nl",
  holland: "nl",
  belgium: "be",
  belgië: "be",
  belgique: "be",
  switzerland: "ch",
  schweiz: "ch",
  suisse: "ch",
  austria: "at",
  österreich: "at",
  oesterreich: "at",
  sweden: "se",
  sverige: "se",
  norway: "no",
  norge: "no",
  denmark: "dk",
  danmark: "dk",
  finland: "fi",
  suomi: "fi",
  portugal: "pt",
  greece: "gr",
  ireland: "ie",
  "new zealand": "nz",
  brazil: "br",
  brasil: "br",
  mexico: "mx",
  méxico: "mx",
  japan: "jp",
  "south korea": "kr",
  korea: "kr",
  china: "cn",
  russia: "ru",
  singapore: "sg",
  malaysia: "my",
  indonesia: "id",
  thailand: "th",
  philippines: "ph",
  vietnam: "vn",
  turkey: "tr",
  türkiye: "tr",
  poland: "pl",
  polska: "pl",
  "czech republic": "cz",
  czechia: "cz",
  hungary: "hu",
  romania: "ro",
  bulgaria: "bg",
  croatia: "hr",
  slovakia: "sk",
  slovenia: "si",
  estonia: "ee",
  latvia: "lv",
  lithuania: "lt",
  luxembourg: "lu",
  iceland: "is",
  "south africa": "za",
  egypt: "eg",
  nigeria: "ng",
  kenya: "ke",
  israel: "il",
  "saudi arabia": "sa",
  "united arab emirates": "ae",
  uae: "ae",
  qatar: "qa",
  kuwait: "kw",
  bahrain: "bh",
  oman: "om",
  argentina: "ar",
  chile: "cl",
  colombia: "co",
  peru: "pe",
  pakistan: "pk",
  bangladesh: "bd",
  "sri lanka": "lk",
  nepal: "np",
};

function resolveCountryCode(countryName: string): string | null {
  const trimmed = countryName.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (COUNTRY_NAME_TO_CODE[lower]) return COUNTRY_NAME_TO_CODE[lower];
  return null;
}

interface UsePostalCodeLookupOptions {
  setValue: UseFormSetValue<PatientFormInput>;
  debounceMs?: number;
}

export function usePostalCodeLookup({ setValue, debounceMs = 500 }: UsePostalCodeLookupOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastLookedUpRef = useRef<string | null>(null);

  const lookupPostalCode = useCallback(
    (postalCode: string, rawCountry: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const code = postalCode.trim();
      if (!code) {
        setLoading(false);
        setError(null);
        return;
      }

      const lookupKey = `${code}|${rawCountry.trim().toLowerCase()}`;
      if (lookupKey === lastLookedUpRef.current) return;
      lastLookedUpRef.current = lookupKey;

      setLoading(true);
      setError(null);

      timerRef.current = setTimeout(() => {
        if (abortRef.current) {
          abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        const countryCode = resolveCountryCode(rawCountry);
        if (!countryCode) {
          setLoading(false);
          return;
        }

        const url = `https://api.zippopotam.us/${encodeURIComponent(countryCode)}/${encodeURIComponent(code)}`;

        fetch(url, { signal: controller.signal })
          .then((res) => {
            if (!res.ok) {
              throw new Error("Postal code not found");
            }
            return res.json() as Promise<
              PostalLookupResult & { places?: Array<{ "place name": string; state: string }> }
            >;
          })
          .then((data) => {
            if (controller.signal.aborted) return;
            const place = data.places?.[0];
            if (place) {
              setValue("city", place["place name"], { shouldValidate: false, shouldDirty: true });
              setValue("state", place.state, { shouldValidate: false, shouldDirty: true });
              const existingCountry = rawCountry.trim();
              if (!existingCountry) {
                setValue("country", data.country, { shouldValidate: false, shouldDirty: true });
              }
            }
            setLoading(false);
            setError(null);
          })
          .catch((err: unknown) => {
            if (controller.signal.aborted) return;
            setLoading(false);
            if (err instanceof DOMException && err.name === "AbortError") return;
            setError("Could not find location for this postal code");
          });
      }, debounceMs);
    },
    [setValue, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { loading, error, lookupPostalCode };
}
