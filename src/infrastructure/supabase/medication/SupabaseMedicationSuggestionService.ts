import type { IMedicationSuggestionService } from "@application/ports/IMedicationSuggestionService";
import type {
  MedicationSuggestion,
  DosageOption,
  FrequencyOption,
  RouteOption,
  MedicationDetail,
} from "@domain/patient/MedicationSuggestion";
import { getSupabaseClient } from "../client";

export class SupabaseMedicationSuggestionService implements IMedicationSuggestionService {
  async search(query: string): Promise<MedicationSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const client = getSupabaseClient();
    const result = await client
      .from("medication_suggestions")
      .select("id, medication, dosage")
      .ilike("medication", `%${trimmed}%`)
      .order("medication", { ascending: true })
      .limit(15);

    if (result.error) {
      console.error("Medication search error:", result.error.message, result.error.code);
      return [];
    }

    return (result.data as unknown as { id: string; medication: string; dosage: string }[]).map(
      (row) => ({
        id: row.id,
        name: row.medication,
        genericName: undefined,
        category: undefined,
      }),
    );
  }

  async getDetail(medicationId: string): Promise<MedicationDetail | null> {
    const client = getSupabaseClient();
    const result = await client
      .from("medication_suggestions")
      .select("*")
      .eq("id", medicationId)
      .single();

    if (result.error) {
      console.error("Medication detail error:", result.error.message, result.error.code);
      return null;
    }

    const row = result.data as {
      id: string;
      medication: string;
      dosage: string;
      frequency: string;
      instructions: string;
    } | null;
    if (!row) return null;

    const dosageOptions: DosageOption[] = row.dosage
      ? [{ value: row.dosage, label: row.dosage }]
      : [];

    const frequencyOptions: FrequencyOption[] = row.frequency
      ? [{ value: row.frequency, label: row.frequency }]
      : [];

    const routeOptions: RouteOption[] = [];

    return {
      id: row.id,
      name: row.medication,
      genericName: undefined,
      category: undefined,
      dosageOptions,
      frequencyOptions,
      routeOptions,
      instructions: row.instructions,
    };
  }
}
