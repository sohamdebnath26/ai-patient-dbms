# Dermatology Seed — Operator Guide

This directory ships with a 100-patient dermatology dataset
(`dermatology-seed.sql`) that is fully internally consistent: every patient has
allergies, encounters, consultations, vitals, diagnoses, prescriptions, medical
history, and appointments generated from the same demographic and clinical
profile.

The seed powers the AI chatbot's "summarize this patient" workflows. Without
it, `PatientContextResolver` returns null and the AI replies that no chart
was found.

## Load order

The seed assumes migrations `00001_create_profiles.sql` through
`00006_encounters.sql` have already been applied (they create the healthcare
schema, RLS policies, and the canonical UUIDs the seed references).

1. **Migrations** — apply `supabase/migrations/0000*.sql` if you have not
   already.
2. **Dermatology seed** — open the Supabase SQL Editor and paste the
   contents of `supabase/dermatology-seed.sql`. It is wrapped in
   `BEGIN` / `COMMIT` and is idempotent (`ON CONFLICT DO NOTHING` on the
   synthetic `auth.users` + `profiles` rows it creates).
3. **Bootstrap your account to `doctor`** — new signups default to
   `role = 'patient'`, which means the AI chatbot's RLS-gated reads of
   `diagnoses` and `medical_history` will return zero rows. Run
   `supabase/bootstrap-doctor.sql` after editing the `WHERE email = ...`
   clause to match the account you actually signed up with.

## Sign-in helpers

If you want a ready-made doctor account instead of bootstrapping your own,
also run `supabase/seed.sql`. It creates:

| Email                    | Password      | Role           |
| ------------------------ | ------------- | -------------- |
| `admin@clinic.local`     | `password123` | `admin`        |
| `dr.sarah@clinic.local`  | `password123` | `doctor`       |
| `dr.james@clinic.local`  | `password123` | `doctor`       |
| `reception@clinic.local` | `password123` | `receptionist` |

…plus two sample patients (`MRN-001`, `MRN-002`).

## Verifying the AI can read a chart

After loading the seed and promoting yourself to `doctor`, open the
floating AI Assistant and try:

- "Give me a diagnostic summary for DERM-0001."
- "Show me Amani Gonzalez's allergies and current prescriptions."
- "What's the latest encounter note for patient DERM-0042?"

The assistant bubble should display the resolved patient name next to the
reply (e.g. `· Amani Gonzalez`) and the response should be grounded in the
allergies / diagnoses / vitals / prescriptions pulled by
`PatientContextResolver`.

If the reply says "patient not found":

1. Run `select id, email, role from public.profiles` and confirm your
   account is `doctor`.
2. Run `select count(*) from public.patients where mrn like 'DERM-%'`
   in the SQL Editor — it should return `100`.
3. Make sure the Vercel `OPENROUTER_API_KEY` (or `DEEPSEEK_API_KEY` for
   the Supabase Edge Function) is configured; without it the LLM call
   fails and the assistant surfaces the error in the red bubble.
