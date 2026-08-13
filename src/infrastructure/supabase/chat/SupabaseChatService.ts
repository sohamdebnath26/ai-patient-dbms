import { getSupabaseClient } from "../client";
import type { ChatRequest, ChatResponse } from "@domain/chat";
import type { IChatService } from "@application/ports/IChatService";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTIONS_VERSION = "v1";

function buildFunctionUrl(functionName: string): string {
  if (!SUPABASE_URL) {
    throw new Error("Supabase URL is not configured.");
  }
  return `${SUPABASE_URL}/functions/v1/${FUNCTIONS_VERSION}/${functionName}`;
}

export class SupabaseChatService implements IChatService {
  async send(request: ChatRequest): Promise<ChatResponse> {
    const client = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      throw new Error(`Auth error: ${sessionError.message}`);
    }
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("You must be signed in to use the AI assistant.");
    }

    const response = await fetch(buildFunctionUrl("chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) detail = body.error;
      } catch {
        // non-json error body, keep statusText
      }
      throw new Error(`Chat service error (${response.status}): ${detail}`);
    }

    const data = (await response.json()) as ChatResponse;
    return data;
  }
}
