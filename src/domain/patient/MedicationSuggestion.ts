export interface MedicationSuggestion {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
}

export interface DosageOption {
  value: string;
  label: string;
}

export interface FrequencyOption {
  value: string;
  label: string;
}

export interface RouteOption {
  value: string;
  label: string;
}

export interface MedicationDetail {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  dosageOptions: DosageOption[];
  frequencyOptions: FrequencyOption[];
  routeOptions: RouteOption[];
  commonDuration?: string;
  instructions?: string;
}

export interface MedicationSearchResult {
  query: string;
  results: MedicationSuggestion[];
}
