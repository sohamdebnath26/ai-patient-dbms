# Supabase Edge Functions

## `chat`

AI chatbot backend. Receives the user's conversation history (from the floating `ChatWidget` in the app), exposes two tools to the model:

- `navigate_to({ label, route, description? })` — emits a navigation suggestion the user can click.
- `generate_diagnostic_report({ patient_id, focus_prompt })` — fetches the patient chart (RLS-enforced via the user's JWT) and asks the model to write a structured report citing chart sources.

The function calls **DeepSeek** (`deepseek-chat`) using an OpenAI-compatible request shape with `tools` / `tool_choice`.

## Environment

The function reads:

- `DEEPSEEK_API_KEY` — required. Set via `supabase secrets set DEEPSEEK_API_KEY=...`.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — provided automatically by the Supabase runtime.

## Deploy

```bash
supabase login
supabase link --project-ref stswvfwfvppzfranrrgp
supabase secrets set DEEPSEEK_API_KEY=sk-...
supabase functions deploy chat
```

Or use the npm scripts from the repo root:

```bash
npm run supabase:secrets:set:deepseek -- sk-...
npm run supabase:deploy:functions
```

## HIPAA / PHI warning

DeepSeek does not currently offer a HIPAA BAA. Treat this function as **non-production** until either (a) you swap the provider for one with a signed BAA, or (b) you de-identify patient payloads before they leave your tenant. The provider boundary is in `index.ts` (`callDeepSeek`) and can be swapped behind the same `SYSTEM_PROMPT` / `TOOLS` contract.
