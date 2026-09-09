import { getSupabaseClient } from "../client";

interface LearnedTermRow {
  id: string;
  category: string;
  term: string;
  usage_count: number;
}

const STATIC_OPTIONS: Record<string, readonly string[]> = {
  skin_disease: [
    "Eczema",
    "Psoriasis",
    "Acne",
    "Rosacea",
    "Contact Dermatitis",
    "Atopic Dermatitis",
    "Seborrheic Dermatitis",
    "Vitiligo",
    "Melasma",
    "Urticaria",
    "Folliculitis",
    "Herpes Zoster",
    "Warts",
    "Fungal Infection",
    "Alopecia",
    "Melanoma",
    "Basal Cell Carcinoma",
    "Squamous Cell Carcinoma",
    "Actinic Keratosis",
    "Keratosis Pilaris",
  ],
  surgery: [
    "Appendectomy",
    "Cholecystectomy",
    "Cesarean Section",
    "Hysterectomy",
    "Knee Arthroscopy",
    "Cataract Surgery",
    "Skin Graft",
    "Mohs Surgery",
    "Excision Biopsy",
    "Incision and Drainage",
    "Tonsillectomy",
    "Hernia Repair",
    "Coronary Bypass",
    "Joint Replacement",
    "Thyroidectomy",
  ],
  condition: [
    "Diabetes Mellitus",
    "Hypertension",
    "Asthma",
    "COPD",
    "Coronary Artery Disease",
    "Chronic Kidney Disease",
    "Hypothyroidism",
    "Hyperthyroidism",
    "Rheumatoid Arthritis",
    "Osteoarthritis",
    "Osteoporosis",
    "Epilepsy",
    "Migraine",
    "Anemia",
    "Hepatitis B",
    "Hepatitis C",
    "HIV",
    "Tuberculosis",
    "Depression",
    "Anxiety Disorder",
    "Obesity",
    "Dyslipidemia",
    "GERD",
    "IBS",
    "PCOS",
  ],
};

export interface TermSuggestion {
  value: string;
  isLearned: boolean;
}

const learnedCache: Record<string, TermSuggestion[]> = {};
let cacheLoaded = false;

async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  const client = getSupabaseClient();
  const { data } = (await client
    .from("learned_terms")
    .select("category, term")
    .order("usage_count", { ascending: false })) as unknown as {
    data: LearnedTermRow[] | null;
  };

  for (const cat of Object.keys(STATIC_OPTIONS)) {
    const staticTerms: TermSuggestion[] = STATIC_OPTIONS[cat].map((t) => ({
      value: t,
      isLearned: false,
    }));
    const learned = (data ?? [])
      .filter((r) => r.category === cat)
      .map((r) => ({ value: r.term, isLearned: true }));
    learnedCache[cat] = [...learned, ...staticTerms];
  }
  cacheLoaded = true;
}

export function getCategorySuggestions(category: string, query: string): TermSuggestion[] {
  const all = learnedCache[category] ?? [];
  if (!query.trim()) return all;
  const q = query.trim().toLowerCase();
  return all.filter((s) => s.value.toLowerCase().includes(q));
}

export async function ensureCacheLoaded(): Promise<void> {
  await loadCache();
}

export async function learnTerm(category: string, term: string): Promise<void> {
  const client = getSupabaseClient();
  const trimmed = term.trim();
  if (!trimmed) return;

  const { data: existing } = (await client
    .from("learned_terms")
    .select("id, usage_count")
    .eq("category", category)
    .eq("term", trimmed)
    .maybeSingle()) as unknown as {
    data: { id: string; usage_count: number } | null;
  };

  if (existing) {
    await client
      .from("learned_terms")
      .update({ usage_count: existing.usage_count + 1 })
      .eq("id", existing.id);
  } else {
    await client.from("learned_terms").insert({
      category,
      term: trimmed,
      usage_count: 1,
    });
  }

  const cached = learnedCache[category] ?? [];
  const without = cached.filter((s) => s.value !== trimmed);
  learnedCache[category] = [{ value: trimmed, isLearned: true }, ...without];
}
