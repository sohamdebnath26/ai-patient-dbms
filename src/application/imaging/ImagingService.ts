import type { IClinicalImageRepository } from "@application/ports/IClinicalImageRepository";
import type { IImageAnalysisRepository } from "@application/ports/IImageAnalysisRepository";
import type { IImageAnalysisProvider } from "@application/ports/IImageAnalysisProvider";
import type {
  ClinicalImage,
  ClinicalImageUploadInput,
  ImageAnalysis,
  AuthorizationContext,
} from "@domain/patient";

export class ClinicalImageService {
  constructor(private readonly imageRepo: IClinicalImageRepository) {}

  async upload(
    patientId: string,
    input: ClinicalImageUploadInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<ClinicalImage> {
    if (input.file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be under 10 MB.");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(input.file.type)) {
      throw new Error(`Unsupported file type: ${input.file.type}. Accepted: JPEG, PNG, WebP.`);
    }

    return this.imageRepo.upload(patientId, input, auth, encounterId);
  }

  async getSignedUrl(imageId: string): Promise<string> {
    return this.imageRepo.getSignedUrl(imageId);
  }

  async delete(imageId: string): Promise<void> {
    return this.imageRepo.delete(imageId);
  }

  async listByPatient(patientId: string, auth: AuthorizationContext): Promise<ClinicalImage[]> {
    return this.imageRepo.listByPatient(patientId, auth);
  }

  async getById(imageId: string): Promise<ClinicalImage | null> {
    return this.imageRepo.getById(imageId);
  }
}

export class ImageAnalysisService {
  constructor(
    private readonly analysisRepo: IImageAnalysisRepository,
    private readonly imageRepo: IClinicalImageRepository,
    private readonly provider: IImageAnalysisProvider,
  ) {}

  async requestAnalysis(
    clinicalImageId: string,
    patientId: string,
    auth: AuthorizationContext,
  ): Promise<ImageAnalysis> {
    const image = await this.imageRepo.getById(clinicalImageId);
    if (!image) throw new Error("Clinical image not found.");

    const existing = await this.analysisRepo.getLatest(clinicalImageId);
    if (existing && (existing.status === "pending" || existing.status === "processing")) {
      throw new Error("An analysis is already in progress for this image.");
    }

    const analysis = await this.analysisRepo.create(
      clinicalImageId,
      patientId,
      this.provider.provider,
      this.provider.model,
      auth,
    );

    await this.analysisRepo.updateStatus(analysis.id, "processing");

    const startTime = Date.now();

    try {
      const signedUrl = await this.imageRepo.getSignedUrl(clinicalImageId, 300);
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Failed to fetch image from storage.");
      const imageBuffer = await response.arrayBuffer();

      const result = await this.provider.analyzeImage({
        imagePath: image.storage_path,
        imageBuffer,
        contentType: image.content_type ?? "image/jpeg",
      });

      const processingTimeMs = Date.now() - startTime;

      return await this.analysisRepo.updateStatus(
        analysis.id,
        "completed",
        result,
        processingTimeMs,
      );
    } catch (err) {
      const processingTimeMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : "Analysis failed.";
      return await this.analysisRepo.updateStatus(
        analysis.id,
        "failed",
        undefined,
        processingTimeMs,
        message,
      );
    }
  }

  async getAnalysis(imageId: string): Promise<ImageAnalysis | null> {
    return this.analysisRepo.getLatest(imageId);
  }

  async getById(analysisId: string): Promise<ImageAnalysis | null> {
    return this.analysisRepo.getById(analysisId);
  }

  async getPatientAnalyses(
    patientId: string,
    status?: ImageAnalysis["status"],
  ): Promise<ImageAnalysis[]> {
    return this.analysisRepo.listByPatient(patientId, status);
  }
}
