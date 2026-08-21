import type { IClinicalImageRepository } from "@application/ports/IClinicalImageRepository";
import type {
  ClinicalImage,
  ClinicalImageUploadInput,
  AuthorizationContext,
} from "@domain/patient";
import { ClinicalImageSchema } from "@domain/patient";
import { getSupabaseClient } from "../client";

interface ClinicalImageRow {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  organization_id: string | null;
  clinic_id: string | null;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  body_area: string | null;
  diagnosis: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const BUCKET = "clinical-images";

function mapToClinicalImage(raw: ClinicalImageRow): ClinicalImage {
  return ClinicalImageSchema.parse(raw);
}

export class SupabaseClinicalImageRepository implements IClinicalImageRepository {
  async upload(
    patientId: string,
    input: ClinicalImageUploadInput,
    auth: AuthorizationContext,
    encounterId?: string,
    onProgress?: (pct: number) => void,
  ): Promise<ClinicalImage> {
    const client = getSupabaseClient();

    const timestamp = Date.now();
    const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `patients/${patientId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(storagePath, input.file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data, error } = (await client
      .from("clinical_images")
      .insert({
        patient_id: patientId,
        encounter_id: encounterId ?? null,
        organization_id: auth.selectedOrganizationId,
        clinic_id: auth.selectedClinicId ?? null,
        storage_path: storagePath,
        file_name: input.file.name,
        file_size: input.file.size,
        content_type: input.file.type || null,
        body_area: input.body_area ?? null,
        diagnosis: input.diagnosis ?? null,
        notes: input.notes ?? null,
        created_by: auth.userId,
      })
      .select("*")
      .single()) as unknown as {
      data: ClinicalImageRow | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create clinical image record.");

    void onProgress;

    return mapToClinicalImage(data);
  }

  async getSignedUrl(imageId: string, expiresIn = 3600): Promise<string> {
    const client = getSupabaseClient();
    const image = await this.getById(imageId);
    if (!image) throw new Error("Image not found.");

    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUrl(image.storage_path, expiresIn);

    if (error) throw new Error(error.message);

    return data.signedUrl;
  }

  async delete(imageId: string): Promise<void> {
    const client = getSupabaseClient();
    const image = await this.getById(imageId);
    if (!image) throw new Error("Image not found.");

    const { error: storageError } = await client.storage.from(BUCKET).remove([image.storage_path]);

    if (storageError) throw new Error(storageError.message);

    const { error } = await client.from("clinical_images").delete().eq("id", imageId);

    if (error) throw new Error(error.message);
  }

  async listByPatient(patientId: string, auth: AuthorizationContext): Promise<ClinicalImage[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("clinical_images")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })) as unknown as {
      data: ClinicalImageRow[] | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);

    void auth;

    return (data ?? []).map(mapToClinicalImage);
  }

  async listByEncounter(encounterId: string, auth: AuthorizationContext): Promise<ClinicalImage[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("clinical_images")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("created_at", { ascending: false })) as unknown as {
      data: ClinicalImageRow[] | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);

    void auth;

    return (data ?? []).map(mapToClinicalImage);
  }

  async getById(imageId: string): Promise<ClinicalImage | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("clinical_images")
      .select("*")
      .eq("id", imageId)
      .maybeSingle()) as unknown as {
      data: ClinicalImageRow | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    return data ? mapToClinicalImage(data) : null;
  }
}
