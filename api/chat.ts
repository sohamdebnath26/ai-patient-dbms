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

function getCorsHeaders(origin: string | null): Record<string, string> {
  const fallbackOrigin = ALLOWED_ORIGINS[0] ?? "";
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : fallbackOrigin;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "AI service is not configured. Set OPENROUTER_API_KEY in the environment.",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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
        return new Response(JSON.stringify({ error: "AI service authentication failed." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI service has insufficient credits. Contact the administrator.",
          }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      return new Response(JSON.stringify({ error: message }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(JSON.stringify({ error: "AI request timed out." }), {
        status: 504,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Network error",
      }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } finally {
    clearTimeout(timeout);
  }
}
