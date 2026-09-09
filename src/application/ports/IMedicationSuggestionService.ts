import type { MedicationSuggestion, MedicationDetail } from "@domain/patient/MedicationSuggestion";

export interface IMedicationSuggestionService {
  search(query: string): Promise<MedicationSuggestion[]>;
  getDetail(medicationId: string): Promise<MedicationDetail | null>;
}
