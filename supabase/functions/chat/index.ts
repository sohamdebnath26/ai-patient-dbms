import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "deepseek/deepseek-chat";
const MAX_TOOL_ITERATIONS = 4;

type ChatRole = "user" | "assistant" | "system" | "tool";

interface IncomingMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  currentPath?: string;
  activePatientId?: string;
}

interface NavigationAction {
  kind: "navigate";
  label: string;
  route: string;
  description?: string;
}

interface DiagnosticReportAction {
  kind: "diagnostic_report";
  patientId: string;
  patientName: string;
  title: string;
  focusPrompt: string;
  generatedAt: string;
  summary: string;
  sections: { heading: string; body: string }[];
  citations: { label: string; source: string }[];
  disclaimer: string;
}

type Action = NavigationAction | DiagnosticReportAction;

const SYSTEM_PROMPT = `You are ClinicOS AI, an assistant inside an electronic health record system.

You have exactly two tools:
1. \`navigate_to\` - propose a navigation action the user can click. Use this for any request that is essentially a route change, a list filter, or a record lookup by ID.
2. \`generate_diagnostic_report\` - pull a full chart for a patient and synthesize a clinician-facing diagnostic report tailored to the doctor's focus prompt.

Rules:
- Never invent patient IDs, names, dates, lab values, vitals, or diagnoses. Only use data returned by \`generate_diagnostic_report\`.
- Prefer calling a tool over free-text answers when the user asks for navigation or a patient report.
- After a tool call, summarize in 1-3 short sentences. Do not repeat the report verbatim - the report is rendered as a card.
- If the user has no active patient and asks for a diagnostic report, ask which patient to open first or suggest navigating to the patient list.
- Keep replies concise. Use clinical language appropriate for a physician.
- All AI-generated content is a suggestion for clinician review, not a clinical decision.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "navigate_to",
      description:
        "Propose a navigation action the user can click. Use for moving between pages, opening a specific record, or applying a filter.",
      parameters: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Short button label, e.g. 'Open patient list'.",
          },
          route: {
            type: "string",
            description: "Absolute in-app path starting with '/', e.g. '/patients'.",
          },
          description: {
            type: "string",
            description: "Optional one-sentence reason for the suggestion.",
          },
        },
        required: ["label", "route"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_diagnostic_report",
      description:
        "Fetch a patient's full chart (demographics, allergies, history, vitals, encounters, consultations, diagnoses, prescriptions, lab reports, clinical notes) and produce a structured diagnostic report tailored to the doctor's focus prompt.",
      parameters: {
        type: "object",
        properties: {
          patient_id: {
            type: "string",
            description: "UUID of the patient.",
          },
          focus_prompt: {
            type: "string",
            description:
              "Doctor's instruction for the report focus, e.g. 'cardiovascular risk assessment' or 'pre-operative summary for knee surgery'.",
          },
        },
        required: ["patient_id", "focus_prompt"],
      },
    },
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function getEnv(key: string): string | undefined {
  try {
    return Deno.env.get(key);
  } catch {
    return undefined;
  }
}

function buildSupabaseClient(req: Request): SupabaseClient {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment is not configured.");
  }
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchPatientContext(
  supabase: SupabaseClient,
  patientId: string,
): Promise<Record<string, unknown> | { error: string }> {
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, dob, gender, blood_group, marital_status, occupation, email, phone, address, mrn, status",
    )
    .eq("id", patientId)
    .maybeSingle();
  if (patientError) return { error: `Failed to load patient: ${patientError.message}` };
  if (!patient) return { error: `Patient ${patientId} not found or not accessible.` };

  const queries = await Promise.all([
    supabase.from("allergies").select("*").eq("patient_id", patientId),
    supabase.from("medical_history").select("*").eq("patient_id", patientId),
    supabase
      .from("vitals")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(10),
    supabase
      .from("encounters")
      .select("*")
      .eq("patient_id", patientId)
      .order("encounter_date", { ascending: false })
      .limit(10),
    supabase
      .from("consultations")
      .select("*")
      .eq("patient_id", patientId)
      .order("consultation_date", { ascending: false })
      .limit(10),
    supabase
      .from("diagnoses")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("prescriptions")
      .select("*, prescription_items(*)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("lab_reports")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("clinical_notes")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const labels: Record<string, string> = {
    allergies: "Allergies",
    medical_history: "Medical history",
    vitals: "Recent vitals",
    encounters: "Encounters",
    consultations: "Consultations",
    diagnoses: "Diagnoses",
    prescriptions: "Prescriptions",
    lab_reports: "Lab reports",
    clinical_notes: "Clinical notes",
  };

  const records: Record<string, { data: unknown; label: string; error: string | null }> = {};
  const sources = [
    "allergies",
    "medical_history",
    "vitals",
    "encounters",
    "consultations",
    "diagnoses",
    "prescriptions",
    "lab_reports",
    "clinical_notes",
  ];
  queries.forEach((res, i) => {
    const key = sources[i];
    if (!key) return;
    records[key] = {
      data: res.data ?? [],
      label: labels[key] ?? key,
      error: res.error ? res.error.message : null,
    };
  });

  return { patient, records };
}

function reportDisclaimer(): string {
  return "This report is AI-generated from the patient's chart and is intended as a clinical decision-support aid. A licensed clinician must review and validate before any clinical action is taken.";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function extractFirstJsonObject(text: string): unknown | null {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // not pure JSON
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence && fence[1]) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      // fall through
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
  return null;
}

function coerceSections(value: unknown): { heading: string; body: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const heading = typeof obj.heading === "string" ? obj.heading : "";
      const body = typeof obj.body === "string" ? obj.body : "";
      if (!heading && !body) return null;
      return { heading: heading || "Section", body };
    })
    .filter((s): s is { heading: string; body: string } => s !== null);
}

async function callDeepSeek(
  apiKey: string,
  messages: Array<Record<string, unknown>>,
  toolChoice: "auto" | "none" = "auto",
): Promise<{
  content: string;
  toolCalls: Array<{ id: string; name: string; arguments: string }>;
}> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://clinicos.ai",
      "X-Title": "ClinicOS AI",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      tools: TOOLS,
      tool_choice: toolChoice,
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter/DeepSeek error ${response.status}: ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  };
  const message = payload.choices?.[0]?.message;
  return {
    content: message?.content ?? "",
    toolCalls: (message?.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
    })),
  };
}

async function runChat(req: Request, body: ChatRequestBody): Promise<Response> {
  const deepseekKey = getEnv("DEEPSEEK_API_KEY");
  if (!deepseekKey) {
    return errorResponse("DEEPSEEK_API_KEY is not configured on the server.", 500);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorResponse("`messages` must be a non-empty array.");
  }

  const supabase = buildSupabaseClient(req);

  const contextLines: string[] = [];
  contextLines.push(`Current page: ${body.currentPath ?? "(unknown)"}`);
  if (body.activePatientId) {
    contextLines.push(`Active patient: ${body.activePatientId}`);
  } else {
    contextLines.push("Active patient: none");
  }

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Session context:\n${contextLines.join("\n")}` },
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let finalAction: Action | undefined;
  let finalContent = "";
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations += 1;
    const turn = await callDeepSeek(deepseekKey, messages);

    if (turn.toolCalls.length === 0) {
      finalContent = turn.content;
      break;
    }

    messages.push({
      role: "assistant",
      content: turn.content ?? "",
      tool_calls: turn.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    for (const toolCall of turn.toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(toolCall.arguments) as unknown;
        if (parsed && typeof parsed === "object") {
          args = parsed as Record<string, unknown>;
        }
      } catch {
        args = {};
      }

      if (toolCall.name === "navigate_to") {
        const label = typeof args.label === "string" ? args.label : "Open";
        const route = typeof args.route === "string" ? args.route : "/";
        const description = typeof args.description === "string" ? args.description : undefined;
        const action: NavigationAction = description
          ? { kind: "navigate", label, route, description }
          : { kind: "navigate", label, route };
        finalAction = action;
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ acknowledged: true, action }),
        });
        continue;
      }

      if (toolCall.name === "generate_diagnostic_report") {
        const patientId = typeof args.patient_id === "string" ? args.patient_id : "";
        const focusPrompt = typeof args.focus_prompt === "string" ? args.focus_prompt.trim() : "";

        if (!patientId || !isUuid(patientId)) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: "patient_id must be a UUID." }),
          });
          continue;
        }
        if (!focusPrompt) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: "focus_prompt is required." }),
          });
          continue;
        }

        const context = await fetchPatientContext(supabase, patientId);
        if ("error" in context) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: context.error }),
          });
          continue;
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(context).slice(0, 60_000),
        });

        messages.push({
          role: "user",
          content:
            "Using ONLY the patient chart provided above, write the diagnostic report as a JSON object with this exact shape:\n" +
            '{"title": string, "summary": string, "sections": [{"heading": string, "body": string}, ...], "citations": [{"label": string, "source": "demographics|allergies|medical_history|vitals|encounters|consultations|diagnoses|prescriptions|lab_reports|clinical_notes"}, ...]}\n' +
            "Every claim must cite a source from the chart. Output JSON only, no prose.",
        });

        const followup = await callDeepSeek(deepseekKey, messages, "none");
        const parsed = extractFirstJsonObject(followup.content);
        const patient = (context as { patient: Record<string, unknown> }).patient;
        const fullName =
          `${String(patient.first_name ?? "")} ${String(patient.last_name ?? "")}`.trim();

        const report: DiagnosticReportAction = {
          kind: "diagnostic_report",
          patientId,
          patientName: fullName || "Patient",
          title:
            parsed &&
            typeof parsed === "object" &&
            typeof (parsed as Record<string, unknown>).title === "string"
              ? ((parsed as Record<string, unknown>).title as string)
              : `Diagnostic report - ${focusPrompt}`,
          focusPrompt,
          generatedAt: new Date().toISOString(),
          summary:
            parsed &&
            typeof parsed === "object" &&
            typeof (parsed as Record<string, unknown>).summary === "string"
              ? ((parsed as Record<string, unknown>).summary as string)
              : "Summary unavailable.",
          sections:
            parsed && typeof parsed === "object"
              ? coerceSections((parsed as Record<string, unknown>).sections)
              : [],
          citations:
            parsed &&
            typeof parsed === "object" &&
            Array.isArray((parsed as Record<string, unknown>).citations)
              ? ((parsed as Record<string, unknown>).citations as unknown[])
                  .map((c) => {
                    if (!c || typeof c !== "object") return null;
                    const obj = c as Record<string, unknown>;
                    if (typeof obj.label !== "string" || typeof obj.source !== "string")
                      return null;
                    return { label: obj.label, source: obj.source };
                  })
                  .filter((c): c is { label: string; source: string } => c !== null)
              : [],
          disclaimer: reportDisclaimer(),
        };

        finalAction = report;
        continue;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
      });
    }
  }

  if (finalAction) {
    return jsonResponse({
      message: finalContent || "Here is what I prepared.",
      action: finalAction,
    });
  }

  return jsonResponse({ message: finalContent || "I couldn't produce a response." });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.");
  }

  try {
    return await runChat(req, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
