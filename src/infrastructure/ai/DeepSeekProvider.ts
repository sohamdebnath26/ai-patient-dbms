import {
  type IAIModelProvider,
  type ChatMessage,
  type ChatCompletion,
  AIProviderError,
} from "@application/ports/IAIModelProvider";

interface ChatApiResponse {
  content?: string;
  error?: string;
}

export class DeepSeekProvider implements IAIModelProvider {
  async complete(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<ChatCompletion> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          temperature: options?.temperature ?? 0.3,
          maxTokens: options?.maxTokens ?? 2048,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ChatApiResponse;
        throw new AIProviderError(
          `http-${response.status}`,
          body.error ?? `AI service error (${response.status})`,
        );
      }

      const data = (await response.json()) as ChatApiResponse;
      if (!data.content) {
        throw new AIProviderError("empty-response", "AI service returned an empty response.");
      }

      return { content: data.content };
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
