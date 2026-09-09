import type { IMedicationSuggestionService } from "@application/ports/IMedicationSuggestionService";
import type {
  MedicationSuggestion,
  DosageOption,
  FrequencyOption,
  RouteOption,
  MedicationDetail,
} from "@domain/patient/MedicationSuggestion";
import { getSupabaseClient } from "../client";

interface MedicationSuggestionRow {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export class SupabaseMedicationSuggestionService implements IMedicationSuggestionService {
  async search(query: string): Promise<MedicationSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("medication_suggestions")
      .select("id, medication, dosage")
      .ilike("medication", `%${trimmed}%`)
      .order("medication", { ascending: true })
      .limit(15)) as unknown as {
      data: MedicationSuggestionRow[] | null;
      error: { message: string } | null;
    };

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.medication,
      genericName: undefined,
      category: undefined,
    }));
  }

  async getDetail(medicationId: string): Promise<MedicationDetail | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("medication_suggestions")
      .select("*")
      .eq("id", medicationId)
      .single()) as unknown as {
      data: MedicationSuggestionRow | null;
      error: { message: string } | null;
    };

    if (error || !data) return null;

    const dosageOptions: DosageOption[] = data.dosage
      ? [{ value: data.dosage, label: data.dosage }]
      : [];

    const frequencyOptions: FrequencyOption[] = data.frequency
      ? [{ value: data.frequency, label: data.frequency }]
      : [];

    const routeOptions: RouteOption[] = [];

    return {
      id: data.id,
      name: data.medication,
      genericName: undefined,
      category: undefined,
      dosageOptions,
      frequencyOptions,
      routeOptions,
      instructions: data.instructions,
    };
  }
}
