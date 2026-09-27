import { getSupabaseClient } from "@infrastructure/supabase/client";

export interface CurrentAssessmentContext {
  bodyArea?: string;
  finding?: string;
  symptoms?: string;
  morphology?: string;
  distribution?: string;
  severity?: string;
  onset?: string;
  duration?: string;
}

export interface AIAnalysisRequest {
  patientId: string;
  currentAssessment: CurrentAssessmentContext;
  selectedImageUrl?: string;
}

export interface SOAPDraft {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface AIAnalysisResponse {
  clinicalSummary: string;
  currentFindings: string;
  longitudinalChanges: string;
  possibleConsiderations: string;
  treatmentConsiderations: string;
  soapDraft: SOAPDraft;
}

interface EdgeFunctionResponse {
  analysis?: AIAnalysisResponse;
  error?: string;
}

export class SupabaseAIAnalysisService {
  async runAnalysis(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const client = getSupabaseClient();

    const { data, error } = (await client.functions.invoke<EdgeFunctionResponse>("chat", {
      body: {
        type: "clinical_analysis",
        patient_id: req.patientId,
        current_assessment: req.currentAssessment,
        selected_image_url: req.selectedImageUrl,
      },
    })) as { data: EdgeFunctionResponse | null; error: { message: string } | null };

    if (error || !data || data.error) {
      const errMsg = error ? error.message : data?.error;
      throw new Error(
        errMsg ||
          "AI Model / MedGemma is currently unavailable or not configured. Please ensure your backend function and model endpoints are active.",
      );
    }

    if (!data.analysis) {
      throw new Error("AI analysis service returned an incomplete response.");
    }

    return data.analysis;
  }
}
