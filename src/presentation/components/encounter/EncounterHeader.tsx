import { Save, CheckCircle, FileText, Sparkles, Loader2 } from "lucide-react";

interface EncounterHeaderProps {
  patientName: string;
  mrn: string;
  age: string;
  gender: string;
  bloodGroup: string;
  currentDiagnosis: string;
  encounterNumber: string;
  encounterDate: string;
  doctor: string;
  status: string;
  isActive: boolean;
  saving: boolean;
  completing: boolean;
  onSave: () => void;
  onComplete: () => void;
  onGeneratePrescription: () => void;
  onGenerateReport: () => void;
  onOpenAi: () => void;
}

export function EncounterHeader({
  patientName,
  mrn,
  age,
  gender,
  bloodGroup,
  currentDiagnosis,
  encounterNumber,
  encounterDate,
  doctor,
  status,
  isActive,
  saving,
  completing,
  onSave,
  onComplete,
  onGeneratePrescription,
  onGenerateReport,
  onOpenAi,
}: EncounterHeaderProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{patientName}</h1>
            <div className="mt-2 grid gap-x-4 gap-y-1 text-sm text-gray-600 sm:grid-cols-3">
              <span>
                MRN: <span className="font-mono font-medium text-gray-900">{mrn}</span>
              </span>
              <span>
                Age: <span className="font-medium text-gray-900">{age}</span>
              </span>
              <span>
                Gender: <span className="font-medium text-gray-900">{gender || "—"}</span>
              </span>
              <span>
                Blood Group: <span className="font-medium text-gray-900">{bloodGroup || "—"}</span>
              </span>
              <span>
                Diagnosis:{" "}
                <span className="font-medium text-gray-900">{currentDiagnosis || "—"}</span>
              </span>
              <span>{encounterNumber ? `#${encounterNumber}` : ""}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>Date: {encounterDate}</span>
              <span>Doctor: {doctor}</span>
              <span className="inline-flex items-center gap-1">
                Status:{" "}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    status === "in_progress"
                      ? "bg-green-50 text-green-700"
                      : status === "completed"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {status.replace("_", " ")}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      {isActive && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 px-6 py-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Complete Encounter
          </button>
          <button
            type="button"
            onClick={onGeneratePrescription}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Generate Prescription
          </button>
          <button
            type="button"
            onClick={onGenerateReport}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
          <button
            type="button"
            onClick={onOpenAi}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </button>
        </div>
      )}
    </div>
  );
}
