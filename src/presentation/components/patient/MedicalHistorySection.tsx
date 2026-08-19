import { CollapsibleSection } from "../CollapsibleSection";
import { HeartPulse } from "lucide-react";
import { FieldError } from "./helpers";
import { inputClass, labelClass } from "./utils";
import type { PatientFormSectionProps } from "./types";

export function MedicalHistorySection({ register, errors }: PatientFormSectionProps) {
  return (
    <CollapsibleSection
      title="Medical History"
      icon={<HeartPulse className="h-4 w-4" />}
      collapsible={false}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Chief Complaint *</label>
          <textarea
            {...register("chief_complaint")}
            rows={2}
            placeholder="Primary reason for this visit"
            className={inputClass}
          />
          <FieldError message={errors.chief_complaint?.message} />
        </div>
        <div>
          <label className={labelClass}>Present Illness *</label>
          <textarea
            {...register("present_illness")}
            rows={2}
            placeholder="History of present illness"
            className={inputClass}
          />
          <FieldError message={errors.present_illness?.message} />
        </div>
        <div>
          <label className={labelClass}>Previous Skin Diseases</label>
          <textarea
            {...register("previous_skin_diseases")}
            rows={2}
            placeholder="e.g. Eczema, Psoriasis, Acne"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Previous Surgeries</label>
          <textarea {...register("previous_surgeries")} rows={2} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Other Medical Conditions</label>
          <textarea {...register("other_medical_conditions")} rows={2} className={inputClass} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
