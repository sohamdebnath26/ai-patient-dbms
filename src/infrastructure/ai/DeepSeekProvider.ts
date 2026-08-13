import {
  type IAIModelProvider,
  type ChatMessage,
  type ChatCompletion,
  AIProviderError,
} from "@application/ports/IAIModelProvider";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
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
      throw new AIProviderError("missing-api-key", "DeepSeek API key is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
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
        const body = (await response.json().catch(() => ({}))) as DeepSeekResponse;
        throw new AIProviderError(
          `http-${response.status}`,
          body.error?.message ?? `DeepSeek API error (${response.status})`,
        );
      }

      const data = (await response.json()) as DeepSeekResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AIProviderError("empty-response", "DeepSeek returned an empty response.");
      }

      return { content };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new AIProviderError("timeout", "AI request timed out.");
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
