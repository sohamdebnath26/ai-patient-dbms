import type { ImageAnalysis, AuthorizationContext } from "@domain/patient";

export interface IImageAnalysisRepository {
  create(
    clinicalImageId: string,
    patientId: string,
    provider: string,
    model: string | null,
    auth: AuthorizationContext,
  ): Promise<ImageAnalysis>;

  updateStatus(
    id: string,
    status: ImageAnalysis["status"],
    result?: unknown,
    processingTimeMs?: number,
    errorMessage?: string,
  ): Promise<ImageAnalysis>;

  getLatest(clinicalImageId: string): Promise<ImageAnalysis | null>;

  listByPatient(patientId: string, status?: ImageAnalysis["status"]): Promise<ImageAnalysis[]>;

  getById(id: string): Promise<ImageAnalysis | null>;
}
