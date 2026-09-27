import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { EditPatientFormInput } from "@domain/patient";
import type { ClinicalImage } from "@domain/patient";
import {
  SupabaseAIAnalysisService,
  type AIAnalysisResponse,
  type SOAPDraft,
} from "@infrastructure/supabase/ai/SupabaseAIAnalysisService";
import { useToast } from "@presentation/hooks/useToast";
import { Bot, Sparkles, Loader2, AlertCircle, FileText } from "lucide-react";

interface AIAnalysisSectionProps {
  patientId: string;
  images: ClinicalImage[];
  onTransferSOAPToNotes: (soap: SOAPDraft) => void;
}

const aiService = new SupabaseAIAnalysisService();

export function AIAnalysisSection({
  patientId,
  images,
  onTransferSOAPToNotes,
}: AIAnalysisSectionProps) {
  const { watch } = useFormContext<EditPatientFormInput>();
  const toast = useToast();

  const [selectedImage, setSelectedImage] = useState<string>(images[0]?.storage_path || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);

  // Editable SOAP state
  const [soap, setSoap] = useState<SOAPDraft>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  // Read current form state
  const currentBodyArea = watch("affected_body_areas") || "—";
  const currentDiagnosis = watch("primary_diagnosis") || "—";
  const currentSymptoms = watch("symptoms") || "—";
  const currentSeverity = watch("disease_severity") || "—";

  async function handleRunAIAnalysis() {
    setAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await aiService.runAnalysis({
        patientId,
        currentAssessment: {
          bodyArea: currentBodyArea,
          finding: currentDiagnosis,
          symptoms: currentSymptoms,
          severity: currentSeverity,
        },
        selectedImageUrl: selectedImage,
      });

      setAnalysisResult(result);
      setSoap(result.soapDraft);
      toast.success("AI Analysis completed successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "AI Analysis Model is currently unavailable.";
      setErrorMessage(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleTransfer() {
    if (!soap.subjective && !soap.objective && !soap.assessment && !soap.plan) {
      toast.error("SOAP content is empty.");
      return;
    }
    onTransferSOAPToNotes(soap);
    toast.success("SOAP draft transferred to Doctor's Notes.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">
            AI Clinical Analysis &amp; SOAP Generator
          </h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Context Inputs */}
        <div className="space-y-4">
          {/* Current Assessment Card */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
              1. Current Assessment Context
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-slate-400">Primary Diagnosis:</span>
                <p className="font-semibold text-slate-800">{currentDiagnosis}</p>
              </div>
              <div>
                <span className="font-medium text-slate-400">Body Area:</span>
                <p className="font-semibold text-slate-800">{currentBodyArea}</p>
              </div>
              <div>
                <span className="font-medium text-slate-400">Symptoms:</span>
                <p className="font-semibold text-slate-800">{currentSymptoms}</p>
              </div>
              <div>
                <span className="font-medium text-slate-400">Severity:</span>
                <p className="font-semibold text-slate-800 capitalize">{currentSeverity}</p>
              </div>
            </div>
          </div>

          {/* Clinical Image Selection */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
              2. Clinical Image Selection
            </h3>
            {images.length === 0 ? (
              <p className="text-xs text-slate-400">No clinical images uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedImage}
                  onChange={(e) => {
                    setSelectedImage(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  {images.map((img) => (
                    <option key={img.id} value={img.storage_path}>
                      {img.file_name} ({img.body_area ?? "General"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Run Action */}
          <button
            type="button"
            onClick={() => {
              void handleRunAIAnalysis();
            }}
            disabled={analyzing}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Analyse with AI
          </button>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">AI Analysis Service Unavailable</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Outputs */}
        <div className="space-y-4">
          {analysisResult ? (
            <div className="space-y-4">
              <div className="space-y-1 rounded-md border border-teal-200 bg-teal-50/60 p-3 text-xs">
                <p className="font-bold text-teal-900">Clinical Summary</p>
                <p className="text-teal-800">{analysisResult.clinicalSummary}</p>
              </div>

              {/* Editable SOAP Draft */}
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                    Editable SOAP Draft
                  </h3>
                  <button
                    type="button"
                    onClick={handleTransfer}
                    className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700"
                  >
                    <FileText className="h-3 w-3" />
                    Transfer to Doctor&apos;s Notes
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Subjective
                    </label>
                    <textarea
                      value={soap.subjective}
                      onChange={(e) => {
                        setSoap((p) => ({ ...p, subjective: e.target.value }));
                      }}
                      rows={2}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Objective
                    </label>
                    <textarea
                      value={soap.objective}
                      onChange={(e) => {
                        setSoap((p) => ({ ...p, objective: e.target.value }));
                      }}
                      rows={2}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Assessment
                    </label>
                    <textarea
                      value={soap.assessment}
                      onChange={(e) => {
                        setSoap((p) => ({ ...p, assessment: e.target.value }));
                      }}
                      rows={2}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Plan</label>
                    <textarea
                      value={soap.plan}
                      onChange={(e) => {
                        setSoap((p) => ({ ...p, plan: e.target.value }));
                      }}
                      rows={2}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
              <Bot className="mb-2 h-8 w-8 text-slate-300" />
              <p className="font-semibold text-slate-700">Ready for AI Analysis</p>
              <p className="mt-1">
                Click &quot;Analyse with AI&quot; to construct clinical context and generate
                differential considerations and SOAP drafts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
