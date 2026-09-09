export interface BodyRegion {
  id: string;
  label: string;
  category: string;
  paired: boolean;
}

export const BODY_REGIONS: BodyRegion[] = [
  // Head & Neck
  { id: "scalp", label: "Scalp", category: "Head & Neck", paired: false },
  { id: "forehead", label: "Forehead", category: "Head & Neck", paired: false },
  { id: "face", label: "Face", category: "Head & Neck", paired: false },
  { id: "cheek", label: "Cheek", category: "Head & Neck", paired: true },
  { id: "chin", label: "Chin", category: "Head & Neck", paired: false },
  { id: "nose", label: "Nose", category: "Head & Neck", paired: false },
  { id: "perioral", label: "Perioral", category: "Head & Neck", paired: false },
  { id: "lip", label: "Lip", category: "Head & Neck", paired: false },
  { id: "eyelid", label: "Eyelid", category: "Head & Neck", paired: true },
  { id: "periocular", label: "Periocular", category: "Head & Neck", paired: true },
  { id: "ear", label: "Ear", category: "Head & Neck", paired: true },
  { id: "retroauricular", label: "Retroauricular", category: "Head & Neck", paired: true },
  { id: "neck", label: "Neck", category: "Head & Neck", paired: false },

  // Trunk
  { id: "chest", label: "Chest", category: "Trunk", paired: false },
  { id: "abdomen", label: "Abdomen", category: "Trunk", paired: false },
  { id: "back", label: "Back", category: "Trunk", paired: false },
  { id: "upper_back", label: "Upper Back", category: "Trunk", paired: false },
  { id: "lower_back", label: "Lower Back", category: "Trunk", paired: false },
  { id: "flank", label: "Flank", category: "Trunk", paired: true },
  { id: "axilla", label: "Axilla", category: "Trunk", paired: true },
  { id: "groin", label: "Groin", category: "Trunk", paired: true },
  { id: "buttock", label: "Buttock", category: "Trunk", paired: true },

  // Upper Limb
  { id: "shoulder", label: "Shoulder", category: "Upper Limb", paired: true },
  { id: "upper_arm", label: "Upper Arm", category: "Upper Limb", paired: true },
  { id: "elbow", label: "Elbow", category: "Upper Limb", paired: true },
  { id: "antecubital", label: "Antecubital Fossa", category: "Upper Limb", paired: true },
  { id: "forearm", label: "Forearm", category: "Upper Limb", paired: true },
  { id: "wrist", label: "Wrist", category: "Upper Limb", paired: true },
  { id: "hand", label: "Hand", category: "Upper Limb", paired: true },
  { id: "palm", label: "Palm", category: "Upper Limb", paired: true },
  { id: "dorsum_hand", label: "Dorsum of Hand", category: "Upper Limb", paired: true },
  { id: "finger", label: "Finger", category: "Upper Limb", paired: true },
  { id: "fingernail", label: "Fingernail", category: "Upper Limb", paired: true },

  // Lower Limb
  { id: "thigh", label: "Thigh", category: "Lower Limb", paired: true },
  { id: "knee", label: "Knee", category: "Lower Limb", paired: true },
  { id: "popliteal", label: "Popliteal Fossa", category: "Lower Limb", paired: true },
  { id: "leg", label: "Leg", category: "Lower Limb", paired: true },
  { id: "ankle", label: "Ankle", category: "Lower Limb", paired: true },
  { id: "foot", label: "Foot", category: "Lower Limb", paired: true },
  { id: "sole", label: "Sole", category: "Lower Limb", paired: true },
  { id: "dorsum_foot", label: "Dorsum of Foot", category: "Lower Limb", paired: true },
  { id: "toe", label: "Toe", category: "Lower Limb", paired: true },
  { id: "toenail", label: "Toenail", category: "Lower Limb", paired: true },

  // Genital
  { id: "genital", label: "Genital Area", category: "Genital", paired: false },
  { id: "perianal", label: "Perianal", category: "Genital", paired: false },

  // Generalized
  { id: "generalized", label: "Generalized/Widespread", category: "Other", paired: false },
  { id: "mucosa", label: "Oral/Genital Mucosa", category: "Other", paired: false },
];

export type Side = "left" | "right" | "bilateral";

export function getRegionById(id: string): BodyRegion | undefined {
  return BODY_REGIONS.find((r) => r.id === id);
}

export function resolveCanonicalLabel(regionId: string, side?: Side): string {
  const region = getRegionById(regionId);
  if (!region) return regionId;
  if (!region.paired || !side) return region.label;
  return `${side.charAt(0).toUpperCase() + side.slice(1)} ${region.label}`;
}

export function composeBodyRegionId(regionId: string, side?: Side): string {
  if (!side) return regionId;
  return `${side}_${regionId}`;
}

export function getBodyRegionSearchResults(
  query: string,
): { regionId: string; label: string; category: string; side?: Side }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return BODY_REGIONS.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q),
  ).flatMap((r) => {
    if (r.paired) {
      return [
        { regionId: r.id, label: `Left ${r.label}`, category: r.category, side: "left" as Side },
        { regionId: r.id, label: `Right ${r.label}`, category: r.category, side: "right" as Side },
        {
          regionId: r.id,
          label: `Bilateral ${r.label}`,
          category: r.category,
          side: "bilateral" as Side,
        },
      ];
    }
    return [{ regionId: r.id, label: r.label, category: r.category }];
  });
}

export const MORPHOLOGY_OPTIONS = [
  "Macule",
  "Patch",
  "Papule",
  "Plaque",
  "Nodule",
  "Tumor",
  "Vesicle",
  "Bulla",
  "Pustule",
  "Wheal",
  "Cyst",
  "Erosion",
  "Ulcer",
  "Fissure",
  "Scale",
  "Crust",
  "Lichenification",
  "Atrophy",
  "Scar",
  "Telangiectasia",
  "Comedone",
  "Milia",
  "Purpura",
  "Petechiae",
  "Ecchymosis",
] as const;

export const DISTRIBUTION_OPTIONS = [
  "Localized",
  "Regional",
  "Generalized",
  "Symmetrical",
  "Asymmetrical",
  "Linear",
  "Dermatomal",
  "Photosensitive",
  "Flexural",
  "Extensor",
  "Acral",
  "Follicular",
  "Seborrheic",
  "Intertriginous",
  "Sun-exposed",
  "Pressure areas",
] as const;
