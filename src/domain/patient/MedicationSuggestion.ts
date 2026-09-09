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

export interface MedicationDetail {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  dosageOptions: DosageOption[];
  frequencyOptions: DosageOption[];
  commonDuration?: string;
}

export interface MedicationSearchResult {
  query: string;
  results: MedicationSuggestion[];
}
