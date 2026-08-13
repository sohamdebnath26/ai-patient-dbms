import {
  type IAIModelProvider,
  type ChatMessage,
  type ChatCompletion,
  AIProviderError,
} from "@application/ports/IAIModelProvider";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
  error?: { code?: number; message?: string };
}

export class DeepSeekProvider implements IAIModelProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<ChatCompletion> {
    if (!this.apiKey) {
      throw new AIProviderError(
        "missing-api-key",
        "OpenRouter API key is not configured. Add VITE_OPENROUTER_API_KEY to your .env.local file.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 2048,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as OpenRouterResponse;
        const message = body.error?.message ?? `OpenRouter API error (${response.status})`;
        if (response.status === 401) {
          throw new AIProviderError(
            "unauthorized",
            "Invalid API key. Check that VITE_OPENROUTER_API_KEY is correct.",
          );
        }
        if (response.status === 402) {
          throw new AIProviderError(
            "insufficient-credits",
            "OpenRouter account has insufficient credits. Add credits at openrouter.ai.",
          );
        }
        throw new AIProviderError(`http-${response.status}`, message);
      }

      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AIProviderError("empty-response", "OpenRouter returned an empty response.");
      }

      return { content };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new AIProviderError("timeout", "AI request timed out after 60 seconds.");
      }
      throw new AIProviderError(
        "network-error",
        err instanceof Error ? err.message : "Network error",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
