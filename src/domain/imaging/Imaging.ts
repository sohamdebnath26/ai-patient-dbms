import { z } from "zod";

export const ImageAnalysisStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);

export type ImageAnalysisStatus = z.infer<typeof ImageAnalysisStatusSchema>;

export const ClinicalImageSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid().nullable(),
  clinic_id: z.string().uuid().nullable(),
  storage_path: z.string(),
  file_name: z.string(),
  file_size: z.number().nullable(),
  content_type: z.string().nullable(),
  body_area: z.string().nullable(),
  diagnosis: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ClinicalImage = z.infer<typeof ClinicalImageSchema>;

export const ImageAnalysisSchema = z.object({
  id: z.string().uuid(),
  clinical_image_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  organization_id: z.string().uuid().nullable(),
  status: ImageAnalysisStatusSchema,
  provider: z.string(),
  model: z.string().nullable(),
  result: z.unknown().nullable(),
  processing_time_ms: z.number().nullable(),
  error_message: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;

export const ClinicalImageUploadInputSchema = z.object({
  file: z.instanceof(File),
  body_area: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

export type ClinicalImageUploadInput = z.infer<typeof ClinicalImageUploadInputSchema>;

export const ImageAnalysisRequestSchema = z.object({
  clinical_image_id: z.string().uuid(),
});

export type ImageAnalysisRequest = z.infer<typeof ImageAnalysisRequestSchema>;
