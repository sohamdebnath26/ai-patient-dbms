import { ClipboardList, Check, X } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import type { PatientFormSectionProps } from "./types";

interface CurrentTreatmentSectionProps extends PatientFormSectionProps {
  currentDiagnosis: string;
  prescriptionAvailable: boolean;
  reportGenerated: boolean;
}

function BooleanBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          value ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

export function CurrentTreatmentSection({
  register,
  errors,
  currentDiagnosis,
  prescriptionAvailable,
  reportGenerated,
}: CurrentTreatmentSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeading icon={<ClipboardList className="h-4 w-4" />} title="Current Treatment" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Current Diagnosis</label>
          <p className="mt-1 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {currentDiagnosis || "—"}
          </p>
        </div>
        <div>
          <label className={labelClass}>Current Treatment Plan *</label>
          <textarea {...register("current_treatment")} rows={2} className={inputClass} />
          <FieldError message={errors.current_treatment?.message} />
        </div>
        <BooleanBadge value={prescriptionAvailable} label="Prescription Available" />
        <BooleanBadge value={reportGenerated} label="Report Generated" />
      </div>
    </div>
  );
}
