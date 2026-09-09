export const SYMPTOM_OPTIONS = [
  "itching",
  "pain",
  "burning",
  "bleeding",
  "discharge",
  "redness",
  "scaling",
  "swelling",
  "pigmentation",
  "dryness",
] as const;

export const SKIN_DISEASE_OPTIONS = [
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
] as const;

export const SURGERY_OPTIONS = [
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
] as const;

export const CHRONIC_CONDITION_OPTIONS = [
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
] as const;

export const FAMILY_HISTORY_SKIN_OPTIONS = [
  "Melanoma",
  "Non-Melanoma Skin Cancer",
  "Psoriasis",
  "Eczema",
  "Vitiligo",
  "Alopecia Areata",
  "Lupus",
  "Scleroderma",
] as const;

export const FAMILY_HISTORY_CANCER_OPTIONS = [
  "Breast Cancer",
  "Colorectal Cancer",
  "Lung Cancer",
  "Prostate Cancer",
  "Pancreatic Cancer",
  "Ovarian Cancer",
  "Leukemia",
  "Lymphoma",
  "Melanoma",
  "Gastric Cancer",
] as const;

export const SUN_EXPOSURE_OPTIONS = [
  { value: "minimal", label: "Minimal (mostly indoors)" },
  { value: "moderate", label: "Moderate (daily outdoor activities)" },
  { value: "high", label: "High (occupational/outdoor work)" },
  { value: "excessive", label: "Excessive (sunbathing, tanning)" },
  { value: "sunburns", label: "History of frequent sunburns" },
  { value: "tanning_bed", label: "Tanning bed use" },
] as const;

export const COSMETIC_OPTIONS = [
  { value: "none", label: "None" },
  { value: "makeup", label: "Foundation/Makeup" },
  { value: "skincare", label: "OTC Skincare products" },
  { value: "prescription", label: "Prescription topicals" },
  { value: "fragrance", label: "Fragrances/Perfumes" },
  { value: "hair_dye", label: "Hair dyes/Color" },
  { value: "nails", label: "Nail products/Acrylics" },
  { value: "ayurvedic", label: "Ayurvedic/Herbal products" },
] as const;

export const OCCUPATIONAL_OPTIONS = [
  { value: "chemical", label: "Chemical/Industrial exposure" },
  { value: "dust", label: "Dust/Particulate exposure" },
  { value: "outdoor", label: "Prolonged outdoor work" },
  { value: "healthcare", label: "Healthcare/Latex exposure" },
  { value: "food", label: "Food/hospitality industry" },
  { value: "textile", label: "Textile/Dye industry" },
  { value: "construction", label: "Construction/Mining" },
  { value: "office", label: "Office/Indoor" },
] as const;

export const SKIN_TYPE_OPTIONS = [
  { value: "I", label: "I — Always burns, never tans" },
  { value: "II", label: "II — Usually burns, tans minimally" },
  { value: "III", label: "III — Sometimes burns, tans uniformly" },
  { value: "IV", label: "IV — Rarely burns, tans easily" },
  { value: "V", label: "V — Very rarely burns, tans profusely" },
  { value: "VI", label: "VI — Never burns, deeply pigmented" },
] as const;
