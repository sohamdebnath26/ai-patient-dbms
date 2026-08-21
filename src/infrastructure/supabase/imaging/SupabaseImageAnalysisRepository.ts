import type { IImageAnalysisRepository } from "@application/ports/IImageAnalysisRepository";
import type { ImageAnalysis, AuthorizationContext } from "@domain/patient";
import { ImageAnalysisSchema } from "@domain/patient";
import { getSupabaseClient } from "../client";

interface ImageAnalysisRow {
  id: string;
  clinical_image_id: string;
  patient_id: string;
  organization_id: string | null;
  status: string;
  provider: string;
  model: string | null;
  result: unknown;
  processing_time_ms: number | null;
  error_message: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapToAnalysis(raw: ImageAnalysisRow): ImageAnalysis {
  return ImageAnalysisSchema.parse(raw);
}

export class SupabaseImageAnalysisRepository implements IImageAnalysisRepository {
  async create(
    clinicalImageId: string,
    patientId: string,
    provider: string,
    model: string | null,
    auth: AuthorizationContext,
  ): Promise<ImageAnalysis> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("image_analysis")
      .insert({
        clinical_image_id: clinicalImageId,
        patient_id: patientId,
        organization_id: auth.selectedOrganizationId,
        status: "pending",
        provider,
        model,
        created_by: auth.userId,
      })
      .select("*")
      .single()) as unknown as {
      data: ImageAnalysisRow | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create image analysis record.");

    return mapToAnalysis(data);
  }

  async updateStatus(
    id: string,
    status: ImageAnalysis["status"],
    result?: unknown,
    processingTimeMs?: number,
    errorMessage?: string,
  ): Promise<ImageAnalysis> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("image_analysis")
      .update({
        status,
        ...(result !== undefined ? { result } : {}),
        ...(processingTimeMs !== undefined ? { processing_time_ms: processingTimeMs } : {}),
        ...(errorMessage !== undefined ? { error_message: errorMessage } : {}),
      })
      .eq("id", id)
      .select("*")
      .single()) as unknown as {
      data: ImageAnalysisRow | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Image analysis not found.");

    return mapToAnalysis(data);
  }

  async getLatest(clinicalImageId: string): Promise<ImageAnalysis | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("image_analysis")
      .select("*")
      .eq("clinical_image_id", clinicalImageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as {
      data: ImageAnalysisRow | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    return data ? mapToAnalysis(data) : null;
  }

  async listByPatient(
    patientId: string,
    status?: ImageAnalysis["status"],
  ): Promise<ImageAnalysis[]> {
    const client = getSupabaseClient();
    let query = client
      .from("image_analysis")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = (await query) as unknown as {
      data: ImageAnalysisRow[] | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapToAnalysis);
  }

  async getById(id: string): Promise<ImageAnalysis | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("image_analysis")
      .select("*")
      .eq("id", id)
      .maybeSingle()) as unknown as {
      data: ImageAnalysisRow | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);
    return data ? mapToAnalysis(data) : null;
  }
}
