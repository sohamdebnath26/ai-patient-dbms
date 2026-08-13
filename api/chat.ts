import type { VercelRequest, VercelResponse } from "@vercel/node";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://ai-patient-dbms.vercel.app",
];

function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const fallbackOrigin = ALLOWED_ORIGINS[0] ?? "";
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : fallbackOrigin;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(
  res: VercelResponse,
  status: number,
  body: unknown,
  corsHeaders: Record<string, string>,
): void {
  res.status(status).setHeader("Content-Type", "application/json");
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
  res.json(body);
}

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const originHeader = req.headers["origin"];
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    res.status(204);
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.setHeader(key, value);
    }
    res.end();
    return;
  }

  if (req.method !== "POST") {
    jsonResponse(res, 405, { error: "Method not allowed" }, corsHeaders);
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    jsonResponse(
      res,
      500,
      { error: "AI service is not configured. Set OPENROUTER_API_KEY in the environment." },
      corsHeaders,
    );
    return;
  }

  const body = (
    typeof req.body === "string" ? safeParse(req.body) : req.body
  ) as ChatRequest | null;
  if (!body) {
    jsonResponse(res, 400, { error: "Invalid JSON body" }, corsHeaders);
    return;
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    jsonResponse(res, 400, { error: "messages must be a non-empty array" }, corsHeaders);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 55000);

  try {
    const upstream = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model ?? DEFAULT_MODEL,
        messages: body.messages,
        temperature: body.temperature ?? 0.3,
        max_tokens: body.maxTokens ?? 2048,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const errBody = (await upstream.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const message = errBody.error?.message ?? "OpenRouter error";
      if (upstream.status === 401) {
        jsonResponse(res, 500, { error: "AI service authentication failed." }, corsHeaders);
        return;
      }
      if (upstream.status === 402) {
        jsonResponse(
          res,
          402,
          { error: "AI service has insufficient credits. Contact the administrator." },
          corsHeaders,
        );
        return;
      }
      jsonResponse(res, upstream.status, { error: message }, corsHeaders);
      return;
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    jsonResponse(res, 200, { content }, corsHeaders);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      jsonResponse(res, 504, { error: "AI request timed out." }, corsHeaders);
      return;
    }
    jsonResponse(
      res,
      502,
      { error: err instanceof Error ? err.message : "Network error" },
      corsHeaders,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function safeParse(raw: string): ChatRequest | null {
  try {
    return JSON.parse(raw) as ChatRequest;
  } catch {
    return null;
  }
}
