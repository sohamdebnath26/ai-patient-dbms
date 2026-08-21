import type {
  ClinicalImage,
  ClinicalImageUploadInput,
  AuthorizationContext,
} from "@domain/patient";

export interface IClinicalImageRepository {
  upload(
    patientId: string,
    input: ClinicalImageUploadInput,
    auth: AuthorizationContext,
    encounterId?: string,
    onProgress?: (pct: number) => void,
  ): Promise<ClinicalImage>;

  getSignedUrl(imageId: string, expiresIn?: number): Promise<string>;

  delete(imageId: string): Promise<void>;

  listByPatient(patientId: string, auth: AuthorizationContext): Promise<ClinicalImage[]>;

  listByEncounter(encounterId: string, auth: AuthorizationContext): Promise<ClinicalImage[]>;

  getById(imageId: string): Promise<ClinicalImage | null>;
}
