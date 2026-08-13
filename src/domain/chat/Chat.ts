import { z } from "zod";

export const ChatRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const NavigationActionSchema = z.object({
  kind: z.literal("navigate"),
  label: z.string(),
  route: z.string().startsWith("/"),
  description: z.string().optional(),
});
export type NavigationAction = z.infer<typeof NavigationActionSchema>;

export const DiagnosticReportSectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
});
export type DiagnosticReportSection = z.infer<typeof DiagnosticReportSectionSchema>;

export const DiagnosticReportSchema = z.object({
  kind: z.literal("diagnostic_report"),
  patientId: z.string(),
  patientName: z.string(),
  title: z.string(),
  focusPrompt: z.string(),
  generatedAt: z.string(),
  summary: z.string(),
  sections: z.array(DiagnosticReportSectionSchema),
  citations: z
    .array(
      z.object({
        label: z.string(),
        source: z.enum([
          "demographics",
          "allergies",
          "medical_history",
          "vitals",
          "encounters",
          "consultations",
          "diagnoses",
          "prescriptions",
          "lab_reports",
          "clinical_notes",
        ]),
      }),
    )
    .default([]),
  disclaimer: z.string(),
});
export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;

export const ChatActionSchema = z.discriminatedUnion("kind", [
  NavigationActionSchema,
  DiagnosticReportSchema,
]);
export type ChatAction = z.infer<typeof ChatActionSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: ChatRoleSchema,
  content: z.string(),
  action: ChatActionSchema.optional(),
  createdAt: z.string(),
  pending: z.boolean().default(false),
  error: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: ChatRoleSchema,
      content: z.string(),
    }),
  ),
  currentPath: z.string().optional(),
  activePatientId: z.string().uuid().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  message: z.string(),
  action: ChatActionSchema.optional(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
