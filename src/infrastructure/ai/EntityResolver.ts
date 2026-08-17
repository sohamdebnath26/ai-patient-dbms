import type { Topic, ResolvedEntity } from "@domain/ai/MedicalContext";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  patient: [
    "patient",
    "name",
    "demographic",
    "age",
    "gender",
    "phone",
    "address",
    "email",
    "profile",
  ],
  appointment: [
    "appointment",
    "booked",
    "scheduled",
    "schedule",
    "upcoming",
    "next visit",
    "reschedule",
    "cancel",
    "booking",
  ],
  encounter: [
    "encounter",
    "visit",
    "consultation",
    "consulted",
    "came in",
    "saw the doctor",
    "seen",
  ],
  diagnosis: [
    "diagnosis",
    "diagnoses",
    "condition",
    "conditions",
    "disease",
    "illness",
    "disorder",
    "syndrome",
    "psoriasis",
    "eczema",
    "acne",
    "melasma",
    "vitiligo",
    "tinea",
    "dermatitis",
    "rosacea",
    "alopecia",
    "lupus",
    "melanoma",
  ],
  prescription: [
    "prescription",
    "medication",
    "medications",
    "drug",
    "drugs",
    "taking",
    "prescribed",
    "rx",
    "betamethasone",
    "tacrolimus",
    "tretinoin",
    "doxycycline",
    "isotretinoin",
    "metronidazole",
    "hydroquinone",
    "steroid",
    "ointment",
    "cream",
    "tablet",
    "capsule",
    "dosage",
  ],
  allergy: ["allergy", "allergies", "allergic", "reaction", "sensiti", "rash", "intolerance"],
  vitals: [
    "vital",
    "vitals",
    "blood pressure",
    "bp",
    "heart rate",
    "pulse",
    "temperature",
    "temp",
    "oxygen",
    "spo2",
    "bmi",
    "weight",
    "height",
    "respiratory",
  ],
  history: ["history", "background", "past", "previous", "chronic", "family", "medical background"],
  consultation: ["consultation", "consult", "doctor's note", "doctor notes"],
};

const MRN_REGEX = /\b(?:MRN-?\d{3,6}|DERM-?\d{3,6})\b/i;
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "when",
  "where",
  "why",
  "how",
  "his",
  "her",
  "their",
  "its",
  "my",
  "your",
  "our",
  "this",
  "that",
  "these",
  "those",
  "and",
  "or",
  "but",
  "if",
  "then",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "it",
  "patient",
  "doctor",
  "dr",
  "dr.",
]);

const NON_NAME_WORDS = new Set([
  "show",
  "tell",
  "give",
  "find",
  "search",
  "look",
  "get",
  "list",
  "any",
  "all",
  "some",
  "every",
  "each",
  "his",
  "her",
  "their",
  "their",
  "about",
  "with",
  "from",
  "have",
  "summary",
  "info",
  "information",
  "history",
  "medications",
  "allergies",
  "vitals",
  "diagnosis",
  "diagnoses",
  "prescription",
  "encounter",
  "appointment",
  "doctor",
  "nurse",
  "doctor's",
  "diagnose",
  "diagnostic",
  "patient",
  "patient's",
  "test",
  "tests",
  "result",
  "results",
  "prognosis",
  "outlook",
  "what",
  "when",
  "where",
  "why",
  "how",
  "which",
  "today",
  "yesterday",
  "tomorrow",
  "last",
  "next",
  "first",
  "second",
  "any",
  "any",
  "some",
  "no",
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "visit",
  "consultation",
  "record",
  "records",
  "report",
  "reports",
  "the",
  "a",
  "an",
  "name",
  "age",
  "dob",
  "date",
  "phone",
  "blood",
  "pressure",
  "heart",
  "rate",
  "temperature",
  "weight",
  "height",
  "have",
  "has",
  "had",
  "allergy",
  "allergic",
  "symptom",
  "symptoms",
  "condition",
  "conditions",
  "drug",
  "drugs",
  "cream",
  "ointment",
  "see",
  "showed",
  "shows",
  "say",
  "says",
  "said",
  "got",
  "get",
  "getting",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "should",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "yes",
  "no",
  "not",
  "n't",
  "ok",
  "okay",
  "thanks",
  "thank",
  "please",
  "pls",
  "hi",
  "hello",
  "hey",
  "bye",
  "goodbye",
  "how",
  "what",
  "when",
  "where",
  "why",
  "who",
  "whom",
  "much",
  "many",
  "how many",
  "how much",
  "any",
  "some",
  "all",
  "the",
  "a",
  "an",
  "this",
  "that",
]);

export interface EntityResolver {
  resolve(
    message: string,
    selectedPatient?: { id: string; firstName: string; lastName: string; mrn: string } | null,
  ): ResolvedEntity;
}

export class RegexEntityResolver implements EntityResolver {
  resolve(
    message: string,
    selectedPatient?: { id: string; firstName: string; lastName: string; mrn: string } | null,
  ): ResolvedEntity {
    const result: ResolvedEntity = {
      patient_first_name: null,
      patient_last_name: null,
      patient_mrn: null,
      patient_id: null,
      topics: [],
    };

    if (selectedPatient) {
      result.patient_id = selectedPatient.id;
      result.patient_first_name = selectedPatient.firstName;
      result.patient_last_name = selectedPatient.lastName;
      result.patient_mrn = selectedPatient.mrn;
    }

    const mrnMatch = message.match(MRN_REGEX);
    if (mrnMatch) {
      result.patient_mrn = mrnMatch[0].toUpperCase();
    }

    const uuidMatch = message.match(UUID_REGEX);
    if (uuidMatch) {
      result.patient_id = uuidMatch[0];
    }

    const name = this.extractName(message);
    if (name.first || name.last) {
      result.patient_first_name = name.first;
      result.patient_last_name = name.last;
    }

    result.topics = this.extractTopics(message);

    return result;
  }

  private extractName(message: string): { first: string | null; last: string | null } {
    // Pattern 1: "patient John Doe" or "patient John" — common chatbot phrasing
    const patientPrefixMatch = message.match(
      /(?:patient|for|about|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
    );
    if (patientPrefixMatch && patientPrefixMatch[1]) {
      const name = patientPrefixMatch[1].trim();
      const parts = name.split(/\s+/);
      const first = parts[0] ?? null;
      if (parts.length >= 2 && first) {
        return { first, last: parts[1] ?? null };
      }
      return { first, last: null };
    }

    // Pattern 2: Two adjacent capitalized words (e.g., "John Doe", "Sarah Chen")
    const charAt = (i: number): string => message[i] ?? "";
    const prevChar = (i: number) => (i === 0 ? " " : charAt(i - 1));
    const isWordStart = (i: number) => /[A-Z]/.test(charAt(i)) && !/[A-Za-z]/.test(prevChar(i));

    const words: { word: string; index: number }[] = [];
    for (let i = 0; i < message.length; i++) {
      if (isWordStart(i)) {
        let j = i;
        while (j < message.length && /[A-Za-z'-]/.test(charAt(j))) j++;
        const word = message.slice(i, j);
        if (word.length >= 2 && !NON_NAME_WORDS.has(word.toLowerCase())) {
          words.push({ word, index: i });
        }
      }
    }

    const candidates = words
      .filter((w) => /^[A-Z][a-z]+$/.test(w.word))
      .map((w) => w.word)
      .filter((w) => !NON_NAME_WORDS.has(w.toLowerCase()) && !STOPWORDS.has(w.toLowerCase()));

    const first = candidates[0] ?? null;
    if (candidates.length >= 2 && first) {
      return { first, last: candidates[1] ?? null };
    }
    if (first) {
      return { first, last: null };
    }

    return { first: null, last: null };
  }

  private extractTopics(message: string): Topic[] {
    const lower = message.toLowerCase();
    const found = new Set<Topic>();
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as [Topic, string[]][]) {
      if (keywords.some((kw) => lower.includes(kw))) {
        found.add(topic);
      }
    }
    return Array.from(found);
  }
}
