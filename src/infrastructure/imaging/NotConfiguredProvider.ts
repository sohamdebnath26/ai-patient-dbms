import type {
  IImageAnalysisProvider,
  ImageAnalysisInput,
  ImageAnalysisOutput,
  ProviderHealthStatus,
} from "@application/ports/IImageAnalysisProvider";

export class NotConfiguredProvider implements IImageAnalysisProvider {
  readonly provider = "not-configured";
  readonly model = "none";

  async analyzeImage(_input: ImageAnalysisInput): Promise<ImageAnalysisOutput> {
    return await Promise.reject(
      new Error(
        "Image analysis provider is not configured. To enable analysis, implement the IImageAnalysisProvider interface for your chosen AI provider (e.g. Gemini, OpenAI, Azure).",
      ),
    );
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return await Promise.resolve({
      available: false,
      provider: this.provider,
      model: this.model,
      error: "No image analysis provider configured.",
    });
  }
}
