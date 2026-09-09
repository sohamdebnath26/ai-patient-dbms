import type { IMedicationSuggestionService } from "@application/ports/IMedicationSuggestionService";
import type { MedicationSuggestion, MedicationDetail } from "@domain/patient/MedicationSuggestion";

export class NoOpMedicationSuggestionService implements IMedicationSuggestionService {
  async search(_query: string): Promise<MedicationSuggestion[]> {
    await Promise.resolve();
    return [];
  }

  async getDetail(_medicationId: string): Promise<MedicationDetail | null> {
    await Promise.resolve();
    return null;
  }
}
