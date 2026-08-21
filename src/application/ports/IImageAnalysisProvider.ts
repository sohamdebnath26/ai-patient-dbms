export interface ImageAnalysisInput {
  imagePath: string;
  imageBuffer: ArrayBuffer;
  contentType: string;
  patientContext?: Record<string, unknown>;
}

export interface ImageAnalysisOutput {
  findings: string;
  differentialDiagnoses: string[];
  confidence: number;
  recommendations: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderHealthStatus {
  available: boolean;
  provider: string;
  model: string;
  latencyMs?: number;
  error?: string;
}

export interface IImageAnalysisProvider {
  /** Provider identifier (e.g. "gemini", "openai", "azure") */
  readonly provider: string;

  /** Model identifier (e.g. "gemini-2.0-flash", "gpt-4o") */
  readonly model: string;

  /** Analyze a clinical image and return structured findings */
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisOutput>;

  /** Check if the provider is reachable and configured */
  healthCheck(): Promise<ProviderHealthStatus>;
}
