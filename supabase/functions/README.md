# Supabase Edge Functions

## `chat`

AI chatbot backend. Receives the user's conversation history (from the floating `ChatWidget` in the app), exposes two tools to the model:

- `navigate_to({ label, route, description? })` — emits a navigation suggestion the user can click.
- `generate_diagnostic_report({ patient_id, focus_prompt })` — fetches the patient chart (RLS-enforced via the user's JWT) and asks the model to write a structured report citing chart sources.

## Provider

The function calls **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`) with model `deepseek/deepseek-chat`. OpenRouter is OpenAI-compatible and routes the request to DeepSeek. This swap was made because the active key is OpenRouter-format (`sk-or-v1-...`); direct DeepSeek keys (`sk-...`) are also supported by simply changing the model to `deepseek-chat` and the URL to `https://api.deepseek.com/chat/completions` in `chat/index.ts`. Two constants at the top of the file (`OPENROUTER_API_URL`, `OPENROUTER_MODEL`) are the only things to change.

The secret is read as `DEEPSEEK_API_KEY` for backwards compatibility with the env var name — the value is whatever your provider issued.

## Environment

The function reads:

- `DEEPSEEK_API_KEY` — required. Set via `supabase secrets set DEEPSEEK_API_KEY=...` for the deployed function, or in `supabase/.env` for `supabase functions serve` locally. The file `supabase/.env` is gitignored.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — provided automatically by the Supabase runtime.

## Local development

```bash
# One-time: add your key to the gitignored local env file
echo 'DEEPSEEK_API_KEY=sk-or-v1-...' >> supabase/.env

# Serve the function locally
supabase functions serve chat --env-file supabase/.env
```

The frontend can hit the local function at `http://localhost:54321/functions/v1/chat` (Supabase default) when `supabase status` shows the local stack is up.

## Deploy

```bash
supabase login
supabase link --project-ref stswvfwfvppzfranrrgp
supabase secrets set DEEPSEEK_API_KEY=sk-or-v1-...
supabase functions deploy chat
```

Or use the npm scripts from the repo root:

```bash
npm run supabase:secrets:set:deepseek -- sk-or-v1-...
npm run supabase:deploy:functions
```

## HIPAA / PHI warning

Neither OpenRouter nor DeepSeek currently offers a HIPAA BAA. Treat this function as **non-production** until either (a) you swap the provider for one with a signed BAA, or (b) you de-identify patient payloads before they leave your tenant. The provider boundary is isolated in `chat/index.ts` (`callDeepSeek`) and can be swapped behind the same `SYSTEM_PROMPT` / `TOOLS` contract.

## Key rotation

If this key has been exposed (e.g. committed, pasted in chat, or shown in a screenshot), **revoke it immediately** in your provider's dashboard and issue a new one. Then re-run `supabase secrets set DEEPSEEK_API_KEY=<new-key> --project-ref stswvfwfvppzfranrrgp` and re-deploy.
