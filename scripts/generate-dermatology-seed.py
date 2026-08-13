"""Generate realistic dermatology seed data for the healthcare schema.

Outputs supabase/dermatology-seed.sql with 100 patients, each with
internally consistent appointments, encounters, vitals, diagnoses,
prescriptions, allergies, medical history, and patient contacts.

Run with: python3 scripts/generate-dermatology-seed.py
"""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

random.seed(42)

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

ORGS = {
    "default": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
}
CLINICS = {
    "main": "bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb",
    "north": "bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb",
}
DOCTORS = [
    "22222222-1111-1111-1111-111111111111",  # dr.sarah
    "22222222-2222-2222-2222-222222222222",  # dr.james
    "11111111-1111-1111-1111-111111111111",  # admin (fallback)
]
RECEPTIONIST = "33333333-3333-3333-3333-333333333333"

FIRST_NAMES = [
    "Aarav", "Aanya", "Aditya", "Aisha", "Alexander", "Amara", "Ananya", "Arjun",
    "Benjamin", "Bella", "Carlos", "Charlotte", "Chen", "Chloe", "David", "Diego",
    "Elena", "Emma", "Ethan", "Fatima", "Gabriel", "Grace", "Hiroshi", "Isabella",
    "Jamal", "Jasmine", "João", "Kenji", "Khalil", "Kylie", "Lakshmi", "Liam",
    "Lin", "Lucas", "Madeline", "Mahesh", "Mateo", "Mia", "Naomi", "Ngozi",
    "Nikolai", "Noah", "Olivia", "Omar", "Priya", "Quinn", "Rafael", "Rania",
    "Ravi", "Rosa", "Ryosuke", "Saanvi", "Sami", "Sara", "Sienna", "Sofia",
    "Soren", "Tahir", "Talia", "Tariq", "Thandiwe", "Theo", "Uma", "Valentina",
    "Vera", "Viktor", "Wei", "Willow", "Xavier", "Xinyi", "Yara", "Yuki",
    "Zachary", "Zara", "Zhang", "Zoey", "Aaliyah", "Abdul", "Adrian", "Aiko",
    "Aliyah", "Amani", "Asha", "Beatriz", "Cassandra", "Dimitri", "Eliana",
]

LAST_NAMES = [
    "Patel", "Khan", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
    "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis",
    "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
    "Nguyen", "Hill", "Flores", "Green", "Adams", "Nakamura", "Patel", "Kim",
    "Singh", "Hassan", "Okafor", "Suzuki", "Chen", "Wong", "García", "Rossi",
    "Müller", "Johansson", "Andersson", "Larsson", "Nilsson", "Eriksson", "Karlsson",
    "Ivanov", "Petrov", "Smirnov", "Kumar", "Sharma", "Reddy", "Iyer", "Banerjee",
    "Acharya", "Reddy", "Ahmed", "Khan", "Ali", "Hassan", "Ito", "Sato",
    "Tanaka", "Watanabe", "Yoshida", "Inoue", "Nakamura", "Kobayashi", "Kato",
]

GENDERS = ["Male", "Female"]
MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"]
BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
OCCUPATIONS = [
    "Teacher", "Engineer", "Doctor", "Nurse", "Student", "Manager", "Salesperson",
    "Architect", "Lawyer", "Accountant", "Designer", "Chef", "Mechanic", "Electrician",
    "Plumber", "Carpenter", "Farmer", "Truck Driver", "Pilot", "Scientist",
    "Software Developer", "Marketing Specialist", "Consultant", "Therapist",
    "Retired", "Homemaker", "Freelancer", "Entrepreneur", "Photographer",
]
CITIES_STREETS = [
    ("Springfield", "Maple Ave"),
    ("Rivertown", "Oak St"),
    ("Fairview", "Elm Rd"),
    ("Lakewood", "Pine Blvd"),
    ("Brookside", "Cedar Ln"),
    ("Hillsdale", "Birch Way"),
    ("Greenwich", "Willow Dr"),
    ("Westfield", "Ash Ct"),
    ("Northvale", "Spruce St"),
    ("Southport", "Hawthorn Ave"),
]

# Per-condition realistic data
CONDITIONS = [
    {
        "name": "Psoriasis",
        "icd10": "L40.9",
        "description": "Plaque psoriasis",
        "prevalence": 0.12,
        "allergy_bias": ["Aspirin", "NSAIDs"],
        "history": [
            ("Family history of psoriasis", "chronic"),
            ("Psoriatic arthritis", "chronic"),
        ],
        "medications": [
            ("Betamethasone dipropionate 0.05% ointment", "Applied BID", "Twice daily"),
            ("Tacrolimus 0.1% ointment", "Applied BID", "Twice daily to affected areas"),
            ("Adalimumab 40mg syringe", "0.4 mL", "Every other week"),
            ("Calcipotriene 0.005% ointment", "Applied QD", "Once daily"),
            ("Methotrexate 2.5mg tablets", "2 tablets", "Weekly"),
        ],
        "investigations": [
            "Skin biopsy showed parakeratosis and Munro microabscesses consistent with psoriasis.",
            "PASI score 12.4. Mild erythema and scaling on extensor surfaces.",
            "PASI score 6.8. Significant improvement on biologic therapy.",
        ],
    },
    {
        "name": "Atopic dermatitis",
        "icd10": "L20.9",
        "description": "Atopic dermatitis / eczema",
        "prevalence": 0.10,
        "allergy_bias": ["Nickel", "Fragrance mix", "Wool alcohol"],
        "history": [
            ("Allergic rhinitis", "chronic"),
            ("Childhood asthma", "resolved"),
        ],
        "medications": [
            ("Hydrocortisone 1% cream", "Apply BID", "Twice daily to affected areas"),
            ("Tacrolimus 0.03% ointment", "Apply BID", "Twice daily"),
            ("Cetirizine 10mg tablets", "1 tablet", "Once daily PRN itching"),
            ("Pimecrolimus 1% cream", "Apply BID", "Twice daily"),
            ("Triamcinolone 0.1% cream", "Apply BID", "Twice daily for flares"),
        ],
        "investigations": [
            "Eczema herpeticum ruled out. Skin prick testing positive for house dust mite.",
            "IgE 285 IU/mL. Significant xerosis with lichenification on flexural surfaces.",
            "SCORAD 28. Improved with topical calcineurin inhibitor and emollient regimen.",
        ],
    },
    {
        "name": "Acne vulgaris",
        "icd10": "L70.0",
        "description": "Acne vulgaris",
        "prevalence": 0.15,
        "allergy_bias": ["Benzoyl peroxide"],
        "history": [
            ("Polycystic ovary syndrome", "active"),
        ],
        "medications": [
            ("Adapalene 0.1% gel", "Apply QD", "Once daily at bedtime"),
            ("Benzoyl peroxide 5% wash", "Apply BID", "Twice daily"),
            ("Doxycycline 100mg capsules", "1 capsule", "Twice daily"),
            ("Isotretinoin 20mg capsules", "1 capsule", "Once daily"),
            ("Clindamycin 1% topical solution", "Apply BID", "Twice daily"),
            ("Combined oral contraceptive", "1 tablet", "Once daily"),
        ],
        "investigations": [
            "Inflammatory papules and comedones on face and back. No nodulocystic lesions.",
            "Total lesion count 34. Good adherence to topical retinoid.",
            "Moderate inflammatory acne. Considering isotretinoin given scarring.",
        ],
    },
    {
        "name": "Melasma",
        "icd10": "L81.1",
        "description": "Melasma",
        "prevalence": 0.08,
        "allergy_bias": [],
        "history": [
            ("Pregnancy", "resolved"),
        ],
        "medications": [
            ("Hydroquinone 4% cream", "Apply BID", "Twice daily to affected areas"),
            ("Tretinoin 0.05% cream", "Apply HS", "Once daily at bedtime"),
            ("Tazarotene 0.1% cream", "Apply HS", "Once daily at bedtime"),
            ("Triple combination cream (Kligman)", "Apply QD", "Once daily"),
            ("Broad-spectrum sunscreen SPF 50+", "Apply Q2H", "Every 2 hours during sun exposure"),
        ],
        "investigations": [
            "Hyperpigmented patches on malar eminences. Wood's lamp shows epidermal melasma.",
            "MASI score 18.4. Slow response to topical therapy.",
            "Partial clearance after 3 months of triple combination therapy.",
        ],
    },
    {
        "name": "Vitiligo",
        "icd10": "L80",
        "description": "Vitiligo",
        "prevalence": 0.07,
        "allergy_bias": [],
        "history": [
            ("Autoimmune thyroiditis", "active"),
            ("Type 1 diabetes mellitus", "active"),
        ],
        "medications": [
            ("Tacrolimus 0.1% ointment", "Apply BID", "Twice daily to depigmented areas"),
            ("Clobetasol 0.05% cream", "Apply BID", "Twice daily for facial lesions"),
            ("Narrowband UVB phototherapy", "3 sessions/week", "Monday, Wednesday, Friday"),
            ("Methoxsalen 0.1% solution", "Topical", "Apply before UVA exposure"),
            ("Vitamin D3 2000 IU tablets", "1 tablet", "Once daily"),
        ],
        "investigations": [
            "Depigmented macules on hands and perioral area. Vitiligo Disease Activity score 4.",
            "Wood's lamp accentuates depigmented patches. No mucosal involvement.",
            "Repigmentation noted at perifollicular sites after 8 weeks of NB-UVB.",
        ],
    },
    {
        "name": "Tinea corporis",
        "icd10": "B35.4",
        "description": "Tinea corporis (ringworm)",
        "prevalence": 0.08,
        "allergy_bias": [],
        "history": [
            ("Recent contact with kittens", "resolved"),
        ],
        "medications": [
            ("Terbinafine 1% cream", "Apply BID", "Twice daily for 2 weeks"),
            ("Terbinafine 250mg tablets", "1 tablet", "Once daily for 4 weeks"),
            ("Clotrimazole 1% cream", "Apply BID", "Twice daily"),
            ("Itraconazole 100mg capsules", "2 capsules", "Twice daily for 1 week"),
            ("Ketoconazole 2% shampoo", "Apply to affected areas", "Use as body wash"),
        ],
        "investigations": [
            "KOH prep positive for septate hyphae. Annular plaque with raised, scaly border.",
            "Fungal culture grew Trichophyton rubrum.",
            "Complete resolution after 4 weeks of oral terbinafine.",
        ],
    },
    {
        "name": "Contact dermatitis",
        "icd10": "L23.9",
        "description": "Allergic contact dermatitis",
        "prevalence": 0.10,
        "allergy_bias": ["Nickel sulfate", "Fragrance mix", "Balsam of Peru"],
        "history": [
            ("Eczema", "resolved"),
        ],
        "medications": [
            ("Triamcinolone 0.1% cream", "Apply BID", "Twice daily"),
            ("Hydrocortisone 2.5% cream", "Apply BID", "Twice daily"),
            ("Mometasone furoate 0.1% cream", "Apply QD", "Once daily"),
            ("Cetirizine 10mg tablets", "1 tablet", "Once daily PRN"),
            ("Pimecrolimus 1% cream", "Apply BID", "Twice daily"),
        ],
        "investigations": [
            "Erythema, vesicles, and weeping in distribution of contact with suspected allergen.",
            "Patch testing positive for nickel sulfate. Avoiding jewelry with metal.",
            "Significant improvement after 2 weeks of topical corticosteroid and allergen avoidance.",
        ],
    },
    {
        "name": "Seborrheic dermatitis",
        "icd10": "L21.9",
        "description": "Seborrheic dermatitis",
        "prevalence": 0.10,
        "allergy_bias": [],
        "history": [
            ("Dandruff", "chronic"),
        ],
        "medications": [
            ("Ketoconazole 2% shampoo", "Use twice weekly", "Lather, leave 3 min, rinse"),
            ("Hydrocortisone 1% cream", "Apply BID", "Twice daily to affected areas"),
            ("Ciclopirox 0.77% shampoo", "Use daily", "Once daily for 4 weeks"),
            ("Selenium sulfide 2.5% shampoo", "Use twice weekly", "Lather, leave 5 min, rinse"),
            ("Pimecrolimus 1% cream", "Apply BID", "Twice daily for facial involvement"),
        ],
        "investigations": [
            "Erythema and greasy scaling in nasolabial folds, eyebrows, and scalp.",
            "Seborrheic dermatitis of the scalp and face. Mild case.",
            "Significant improvement with antifungal shampoo and intermittent topical steroid.",
        ],
    },
    {
        "name": "Rosacea",
        "icd10": "L71.8",
        "description": "Rosacea",
        "prevalence": 0.08,
        "allergy_bias": [],
        "history": [
            ("Migraine", "chronic"),
        ],
        "medications": [
            ("Metronidazole 0.75% gel", "Apply BID", "Twice daily"),
            ("Ivermectin 1% cream", "Apply QD", "Once daily"),
            ("Doxycycline 40mg modified-release capsules", "1 capsule", "Once daily"),
            ("Azithromycin 250mg tablets", "2 tablets", "Twice weekly"),
            ("Brimonidine 0.33% gel", "Apply QD", "Once daily for erythema"),
        ],
        "investigations": [
            "Persistent centrofacial erythema with telangiectasias and papulopustular lesions.",
            "Demodex mites noted on standardized skin surface biopsy.",
            "Good response to topical ivermectin and oral doxycycline.",
        ],
    },
    {
        "name": "Alopecia areata",
        "icd10": "L63.8",
        "description": "Alopecia areata",
        "prevalence": 0.07,
        "allergy_bias": [],
        "history": [
            ("Autoimmune thyroiditis", "active"),
            ("Vitiligo", "active"),
        ],
        "medications": [
            ("Mometasone furoate 0.1% cream", "Apply BID", "Twice daily to bald patches"),
            ("Triamcinolone 10mg/mL intralesional injection", "1 mL", "Every 4-6 weeks"),
            ("Minoxidil 5% solution", "Apply BID", "Twice daily"),
            ("Bimatoprost 0.03% solution", "Apply QD", "Once daily"),
            ("Tofacitinib 5mg tablets", "1 tablet", "Twice daily"),
        ],
        "investigations": [
            "Well-demarcated, smooth, hairless patches on scalp. Exclamation point hairs at borders.",
            "Hair pull test positive at periphery. SALT score 24.",
            "Regrowth noted after 3 months of intralesional triamcinolone injections.",
        ],
    },
]

ALLERGY_POOL = [
    ("Penicillin", "Hives and swelling", "severe"),
    ("Sulfa drugs", "Maculopapular rash", "moderate"),
    ("Aspirin", "Wheezing", "moderate"),
    ("Ibuprofen", "Gastric upset", "mild"),
    ("Latex", "Contact dermatitis", "moderate"),
    ("Peanuts", "Anaphylaxis", "life_threatening"),
    ("Shellfish", "Hives", "moderate"),
    ("Nickel", "Contact dermatitis", "moderate"),
    ("Fragrance mix", "Eczema", "mild"),
    ("Wool alcohol", "Itching", "mild"),
    ("Balsam of Peru", "Dermatitis", "mild"),
    ("Preservatives (parabens)", "Contact dermatitis", "mild"),
    ("Dairy", "Eczema flare", "mild"),
    ("Eggs", "Hives", "moderate"),
    ("Soap detergent", "Hand dermatitis", "moderate"),
]

CHIEF_COMPLAINTS = {
    "Psoriasis": "Itchy, scaly plaques on elbows and knees for several weeks.",
    "Atopic dermatitis": "Persistent itchy, dry rash on inner elbows and behind knees.",
    "Acne vulgaris": "Recurring pimples and blackheads on face and back.",
    "Melasma": "Brown patches on cheeks and forehead that worsen with sun exposure.",
    "Vitiligo": "White patches on hands and around mouth, gradually spreading.",
    "Tinea corporis": "Round, scaly, itchy patch with a clear center on the arm.",
    "Contact dermatitis": "Rash and itching after contact with a new lotion or jewelry.",
    "Seborrheic dermatitis": "Flaky, red, itchy patches on scalp and face.",
    "Rosacea": "Persistent facial redness with bumps and visible blood vessels.",
    "Alopecia areata": "Sudden round patches of hair loss on the scalp.",
}

ENCOUNTER_FINDINGS = {
    "Psoriasis": "Well-demarcated, erythematous plaques with silvery scale on extensor surfaces.",
    "Atopic dermatitis": "Excoriated, lichenified patches in flexural distribution. Significant xerosis.",
    "Acne vulgaris": "Mixed comedonal and inflammatory lesions. Some post-inflammatory hyperpigmentation.",
    "Melasma": "Symmetric hyperpigmented macules on malar regions and forehead.",
    "Vitiligo": "Well-demarcated depigmented macules with convex borders.",
    "Tinea corporis": "Annular plaque with raised, scaly, erythematous border and central clearing.",
    "Contact dermatitis": "Erythema, vesicles, and weeping in pattern matching contact with allergen.",
    "Seborrheic dermatitis": "Erythema and greasy yellowish scale in nasolabial folds and scalp.",
    "Rosacea": "Persistent centrofacial erythema, papules, pustules, and telangiectasias.",
    "Alopecia areata": "Smooth, well-circumscribed, non-scarring alopecic patches with exclamation point hairs.",
}

ENCOUNTER_PLANS = {
    "Psoriasis": "Continue topical steroids. Counsel on trigger avoidance. Consider systemic therapy if PASI > 10.",
    "Atopic dermatitis": "Emollients liberally. Topical anti-inflammatory. Bleach baths twice weekly. Allergy referral.",
    "Acne vulgaris": "Topical retinoid + antimicrobial. Consider hormonal therapy. Diet counseling.",
    "Melasma": "Strict photoprotection. Topical lightening agents. Reassess in 3 months.",
    "Vitiligo": "Phototherapy 3x weekly. Topical calcineurin inhibitors. Vitamin D supplementation.",
    "Tinea corporis": "Topical antifungal for 4 weeks. Environmental decontamination. Avoid sharing towels.",
    "Contact dermatitis": "Avoid identified allergen. Topical steroid taper. Patch testing if recurrent.",
    "Seborrheic dermatitis": "Antifungal shampoo 2-3x weekly. Intermittent topical antifungal. Low-potency steroid for flares.",
    "Rosacea": "Trigger avoidance. Gentle skin care. Topical metronidazole. Oral antibiotic for moderate disease.",
    "Alopecia areata": "Intralesional corticosteroids. Topical immunotherapy. Watchful waiting for limited disease.",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def uuid_str() -> str:
    """Generate a fixed-format UUID string (36 chars, lowercase)."""
    import uuid

    return str(uuid.uuid4())


def fmt_date(d: date) -> str:
    return d.strftime("%Y-%m-%d")


def fmt_datetime(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S+00")


def pick_consult_duration(severity: str) -> int:
    return {
        "mild": 20,
        "moderate": 30,
        "severe": 45,
        "life_threatening": 45,
    }.get(severity, 30)


def random_dob(age_min: int, age_max: int) -> date:
    today = date.today()
    days_ago = random.randint(age_min * 365, age_max * 365)
    return date(today.year - days_ago // 365, random.randint(1, 12), random.randint(1, 28))


def contact_value_for(contact_type: str, rng: random.Random) -> str:
    if contact_type == "phone":
        return f"555-{rng.randint(1000, 9999)}"
    if contact_type == "email":
        return f"patient{rng.randint(1000, 9999)}@example.com"
    if contact_type == "address":
        city, street = rng.choice(CITIES_STREETS)
        return f"{rng.randint(10, 9999)} {street}, {city}"
    return "Other"


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------


def generate() -> str:
    rng = random.Random(42)
    out: list[str] = []
    out.append("-- Sample Dermatology Seed Data")
    out.append("-- 100 patients with internally consistent appointments, encounters, vitals,")
    out.append("-- diagnoses, prescriptions, allergies, medical history, and patient contacts.")
    out.append("-- Run in the Supabase SQL Editor (which runs as postgres, bypassing RLS).")
    out.append("")
    out.append("BEGIN;")
    out.append("")

    org_id = ORGS["default"]
    clinic_main = CLINICS["main"]
    clinic_north = CLINICS["north"]
    doctor_ids = DOCTORS[:2]

    # ------------------------------------------------------------------
    # 100 patients distributed across 10 dermatology conditions
    # ------------------------------------------------------------------
    patients: list[dict] = []
    used_mrns: set[str] = set()

    for i in range(100):
        condition = CONDITIONS[i % len(CONDITIONS)]
        # Deterministic id by index for easy reference
        pid = f"dddddddd-1111-1111-{i:04x}-dddddddddddd"
        first = rng.choice(FIRST_NAMES)
        last = rng.choice(LAST_NAMES)
        gender = rng.choice(GENDERS)
        # Age range tuned to condition prevalence
        age = rng.randint(18, 75)
        dob = random_dob(age, age)
        blood = rng.choice(BLOOD_GROUPS)
        marital = rng.choice(MARITAL_STATUSES)
        occupation = rng.choice(OCCUPATIONS)
        city, street = rng.choice(CITIES_STREETS)
        address = f"{rng.randint(10, 9999)} {street}, {city}"
        phone = f"555-{rng.randint(1000, 9999)}"
        email = f"{first.lower()}.{last.lower()}{rng.randint(1, 99)}@example.com"
        # MRN: DERM-0001..0100
        mrn = f"DERM-{i + 1:04d}"
        assert mrn not in used_mrns
        used_mrns.add(mrn)

        patients.append(
            {
                "id": pid,
                "first_name": first,
                "last_name": last,
                "gender": gender,
                "dob": dob,
                "blood_group": blood,
                "marital_status": marital,
                "occupation": occupation,
                "address": address,
                "phone": phone,
                "email": email,
                "mrn": mrn,
                "condition": condition,
            }
        )

    # ------------------------------------------------------------------
    # Bulk INSERT for patients
    # ------------------------------------------------------------------
    out.append("-- Patients")
    out.append(
        "INSERT INTO public.patients (id, organization_id, clinic_id, first_name, last_name, dob, gender, blood_group, marital_status, occupation, email, phone, address, mrn, status, created_by) VALUES"
    )
    patient_rows = []
    for p in patients:
        clinic = clinic_main if rng.random() < 0.7 else clinic_north
        patient_rows.append(
            f"('{p['id']}', '{org_id}', '{clinic}', '{p['first_name']}', '{p['last_name']}', "
            f"'{fmt_date(p['dob'])}', '{p['gender']}', '{p['blood_group']}', "
            f"'{p['marital_status']}', '{p['occupation']}', '{p['email']}', '{p['phone']}', "
            f"'{p['address']}', '{p['mrn']}', 'active', '{doctor_ids[0]}')"
        )
    out.append(",\n".join(patient_rows) + ";")
    out.append("")

    # ------------------------------------------------------------------
    # Patient contacts: 2 per patient (primary phone + email)
    # ------------------------------------------------------------------
    out.append("-- Patient contacts")
    out.append(
        "INSERT INTO public.patient_contacts (id, patient_id, organization_id, clinic_id, contact_type, contact_value, is_primary, label, created_by) VALUES"
    )
    contact_rows = []
    for p in patients:
        # Primary phone
        contact_rows.append(
            f"(gen_random_uuid(), '{p['id']}', '{org_id}', '{clinic_main}', "
            f"'phone', '{p['phone']}', true, 'Mobile', '{doctor_ids[0]}')"
        )
        # Primary email
        contact_rows.append(
            f"(gen_random_uuid(), '{p['id']}', '{org_id}', '{clinic_main}', "
            f"'email', '{p['email']}', true, 'Personal', '{doctor_ids[0]}')"
        )
    out.append(",\n".join(contact_rows) + ";")
    out.append("")

    # ------------------------------------------------------------------
    # Allergies: 1-2 per patient, biased to the condition
    # ------------------------------------------------------------------
    out.append("-- Allergies")
    out.append(
        "INSERT INTO public.allergies (id, patient_id, organization_id, clinic_id, allergen, reaction, severity, status, recorded_date, notes, created_by) VALUES"
    )
    allergy_rows = []
    for p in patients:
        condition = p["condition"]
        # One condition-biased allergy + one random
        biased = p["condition"]["allergy_bias"]
        first_allergen = ""
        if biased:
            first_allergen = biased[rng.randint(0, len(biased) - 1)]
        if not first_allergen:
            first_allergen = rng.choice(ALLERGY_POOL)[0]
        # Pick second allergy not equal to first
        other_pool = [a for a in ALLERGY_POOL if a[0] != first_allergen]
        second_allergen = other_pool[rng.randint(0, len(other_pool) - 1)]
        for allergen, reaction, severity in [
            (first_allergen, "Documented hypersensitivity", severity_lookup(first_allergen)),
            (second_allergen, "Documented hypersensitivity", severity_lookup(second_allergen)),
            ][: rng.randint(1, 3)]:
            recorded = p["dob"] + timedelta(days=365 * rng.randint(20, 40))
            allergy_rows.append(
                f"(gen_random_uuid(), '{p['id']}', '{org_id}', '{clinic_main}', "
                f"'{allergen}', '{reaction}', '{severity}', 'active', '{fmt_date(recorded)}', "
                f"'Reported by patient at intake.', '{doctor_ids[0]}')"
            )
    out.append(",\n".join(allergy_rows) + ";")
    out.append("")

    # ------------------------------------------------------------------
    # Medical history: 1-2 per patient including condition-related
    # ------------------------------------------------------------------
    out.append("-- Medical history")
    out.append(
        "INSERT INTO public.medical_history (id, patient_id, organization_id, clinic_id, condition, diagnosis_date, status, notes, created_by) VALUES"
    )
    history_rows = []
    for p in patients:
        history_options = [(p["condition"]["name"], "chronic", "Initial diagnosis at our clinic.")]
        history_options.extend([(c, s, "Documented in prior records.") for c, s in p["condition"]["history"]])
        for cond, status, notes in rng.sample(history_options, k=min(len(history_options), 2)):
            diag_date = p["dob"] + timedelta(days=365 * rng.randint(18, 50))
            history_rows.append(
                f"(gen_random_uuid(), '{p['id']}', '{org_id}', '{clinic_main}', "
                f"'{cond}', '{fmt_date(diag_date)}', '{status}', '{notes}', '{doctor_ids[0]}')"
            )
    out.append(",\n".join(history_rows) + ";")
    out.append("")

    # ------------------------------------------------------------------
    # Appointments, encounters, vitals, diagnoses, prescriptions
    # ------------------------------------------------------------------
    out.append("-- Appointments + encounters + vitals + diagnoses + prescriptions + prescription_items")
    out.append("-- (each patient has 1-4 appointments; completed ones have an encounter + vitals)")
    out.append("")

    appointment_rows = []
    encounter_rows = []
    consultation_rows = []
    vitals_rows = []
    diagnosis_rows = []
    prescription_rows = []
    prescription_item_rows = []

    today = date.today()
    for p in patients:
        condition = p["condition"]
        n_appts = rng.randint(1, 4)
        # Distribute appointments: most recent past + some history
        for idx in range(n_appts):
            days_offset = rng.randint(7, 180) * (idx + 1) * -1  # past dates
            if idx == 0 and rng.random() < 0.3:
                # Sometimes a follow-up scheduled in the future
                days_offset = rng.randint(7, 60)
            appt_date = today + timedelta(days=days_offset)
            appt_time = f"{rng.randint(8, 16):02d}:{rng.choice([0, 15, 30, 45]):02d}:00"
            doctor_id = doctor_ids[rng.randint(0, len(doctor_ids) - 1)]
            duration = rng.choice([20, 30, 45])
            is_completed = appt_date < today and rng.random() < 0.75
            status = "completed" if is_completed else rng.choice(["scheduled", "confirmed"])
            reason = f"Follow-up: {condition['name']}" if idx > 0 else f"Initial consult: {condition['name']}"
            notes = f"Patient reports symptoms consistent with {condition['name']}."

            appt_id = f"eeeeeee-{idx:02x}-{(patients.index(p)):04x}-eeee-eeeeeeeeeeee"
            appointment_rows.append(
                f"('{appt_id}', '{p['id']}', '{org_id}', '{clinic_main}', '{doctor_id}', "
                f"'{fmt_date(appt_date)}', '{appt_time}', {duration}, 'in_person', '{status}', "
                f"'{escape_sql(reason)}', '{escape_sql(notes)}', '{doctor_id}')"
            )

            if is_completed:
                # Encounter
                enc_id = f"ffffffff-{idx:02x}-{(patients.index(p)):04x}-ffff-ffffffffffff"
                started_at = datetime.combine(appt_date, datetime.min.time()).replace(
                    hour=int(appt_time[:2]),
                    minute=int(appt_time[3:5]),
                ).replace(tzinfo=timezone.utc)
                enc_status = "completed"
                completed_at = started_at + timedelta(hours=1)
                # Alternate chief complaint for variety
                cc = CHIEF_COMPLAINTS[condition["name"]]
                findings = ENCOUNTER_FINDINGS[condition["name"]]
                plan = ENCOUNTER_PLANS[condition["name"]]
                encounter_rows.append(
                    f"('{enc_id}', '{p['id']}', '{appt_id}', '{org_id}', '{clinic_main}', '{doctor_id}', "
                    f"'{fmt_date(appt_date)}', '{escape_sql(cc)}', '{escape_sql(findings)}', "
                    f"'{escape_sql(plan)}', '{enc_status}', '{fmt_datetime(started_at)}', "
                    f"'{fmt_datetime(completed_at)}', '{doctor_id}')"
                )

                # Also insert into consultations (referenced by vitals.consultation_id) using the same id.
                consultation_rows.append(
                    f"('{enc_id}', '{p['id']}', '{appt_id}', '{org_id}', '{clinic_main}', "
                    f"'{fmt_date(appt_date)}', '{escape_sql(cc)}', '{escape_sql(findings)}', "
                    f"'{escape_sql(plan)}', '{enc_status}', '{doctor_id}')"
                )

                # Vitals
                vitals_id = f"aaaaaaaa-{idx:02x}-{(patients.index(p)):04x}-aaaa-aaaaaaaaaaaa"
                temp = round(rng.uniform(36.3, 37.2), 1)
                hr = rng.randint(60, 100)
                sbp = rng.randint(105, 135)
                dbp = rng.randint(65, 88)
                rr = rng.randint(12, 20)
                spo2 = rng.randint(96, 100)
                height_cm = round(rng.uniform(150, 188), 1)
                weight_kg = round(rng.uniform(50, 100), 1)
                vitals_rows.append(
                    f"('{vitals_id}', '{p['id']}', '{enc_id}', '{org_id}', '{clinic_main}', "
                    f"{temp}, {hr}, {sbp}, {dbp}, {rr}, {spo2}, {height_cm}, {weight_kg}, "
                    f"'{fmt_datetime(started_at)}', '{doctor_id}')"
                )

                # Diagnoses (1 primary + sometimes secondary)
                diag_id = f"bbbbbbbb-{idx:02x}-{(patients.index(p)):04x}-bbbb-bbbbbbbbbbbb"
                onset = appt_date - timedelta(days=365 * rng.randint(0, 5))
                diagnosis_rows.append(
                    f"('{diag_id}', '{p['id']}', '{enc_id}', '{org_id}', '{clinic_main}', "
                    f"'{condition['icd10']}', '{escape_sql(condition['description'])}', 'primary', 'active', "
                    f"'{fmt_date(onset)}', NULL, '{escape_sql(condition['name'])} confirmed on examination.', '{doctor_id}')"
                )

                # Prescriptions (1-2 per encounter)
                n_rx = rng.randint(1, 2)
                chosen_meds = rng.sample(condition["medications"], k=min(n_rx, len(condition["medications"])))
                rx_id = f"cccccccc-{idx:02x}-{(patients.index(p)):04x}-cccc-cccccccccccc"
                rx_status = "active"
                prescription_rows.append(
                    f"('{rx_id}', '{p['id']}', '{enc_id}', '{org_id}', '{clinic_main}', "
                    f"'{rx_status}', '{escape_sql(ENCOUNTER_PLANS[condition['name']])}', '{doctor_id}')"
                )
                for med_name, dosage, instructions in chosen_meds:
                    prescription_item_rows.append(
                        f"(gen_random_uuid(), '{rx_id}', '{escape_sql(med_name)}', "
                        f"'{escape_sql(dosage)}', '{escape_sql(instructions)}', "
                        f"'30 days', 'topical', '{escape_sql(instructions)}', 1, 2, '{doctor_id}')"
                    )

    # Write all the bulk INSERT statements
    out.append(
        "INSERT INTO public.appointments (id, patient_id, organization_id, clinic_id, assigned_to, "
        "appointment_date, appointment_time, duration_minutes, type, status, reason, notes, created_by) VALUES"
    )
    out.append(",\n".join(appointment_rows) + ";")
    out.append("")

    out.append(
        "INSERT INTO public.consultations (id, patient_id, appointment_id, organization_id, clinic_id, "
        "consultation_date, chief_complaint, findings, plan, status, created_by) VALUES"
    )
    out.append(",\n".join(consultation_rows) + ";")
    out.append("")

    out.append(
        "INSERT INTO public.encounters (id, patient_id, appointment_id, organization_id, clinic_id, assigned_to, "
        "encounter_date, chief_complaint, findings, plan, status, started_at, completed_at, created_by) VALUES"
    )
    out.append(",\n".join(encounter_rows) + ";")
    out.append("")

    out.append(
        "INSERT INTO public.vitals (id, patient_id, consultation_id, organization_id, clinic_id, "
        "temperature_celsius, heart_rate_bpm, blood_pressure_systolic, blood_pressure_diastolic, "
        "respiratory_rate, oxygen_saturation, height_cm, weight_kg, recorded_at, created_by) VALUES"
    )
    out.append(",\n".join(vitals_rows) + ";")
    out.append("")

    out.append(
        "INSERT INTO public.diagnoses (id, patient_id, consultation_id, organization_id, clinic_id, "
        "icd10_code, description, diagnosis_type, status, onset_date, resolution_date, notes, created_by) VALUES"
    )
    out.append(",\n".join(diagnosis_rows) + ";")
    out.append("")

    out.append(
        "INSERT INTO public.prescriptions (id, patient_id, consultation_id, organization_id, clinic_id, "
        "status, notes, created_by) VALUES"
    )
    out.append(",\n".join(prescription_rows) + ";")
    out.append("")

    out.append(
        "INSERT INTO public.prescription_items (id, prescription_id, medication_name, dosage, frequency, "
        "duration, route, instructions, quantity, refills, created_by) VALUES"
    )
    out.append(",\n".join(prescription_item_rows) + ";")
    out.append("")

    out.append("COMMIT;")
    out.append("")
    return "\n".join(out)


def severity_lookup(allergen: str) -> str:
    for a in ALLERGY_POOL:
        if a[0] == allergen:
            return a[2]
    return "moderate"


def escape_sql(s: str) -> str:
    return s.replace("'", "''")


if __name__ == "__main__":
    sql = generate()
    out_path = Path(__file__).parent.parent / "supabase" / "dermatology-seed.sql"
    out_path.write_text(sql)
    print(f"Wrote {len(sql):,} bytes to {out_path}")
    print(f"Patients: 100")
    print(f"Approx rows: ~{len(sql.split(chr(10)))}")
