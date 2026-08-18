import type { UseFormRegister } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { Activity } from "lucide-react";
import { inputClass, labelClass } from "./utils";

interface LifestyleSectionProps {
  register: UseFormRegister<PatientFormInput>;
  gender: string;
}

export function LifestyleSection({ register, gender }: LifestyleSectionProps) {
  const isFemale = gender.toLowerCase() === "female";

  return (
    <CollapsibleSection title="Lifestyle" icon={<Activity className="h-4 w-4" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Smoking Status</label>
          <select {...register("smoking_status")} className={inputClass}>
            <option value="">Select</option>
            <option value="never">Never</option>
            <option value="former">Former</option>
            <option value="current">Current</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Alcohol Consumption</label>
          <select {...register("alcohol_consumption")} className={inputClass}>
            <option value="">Select</option>
            <option value="none">None</option>
            <option value="occasional">Occasional</option>
            <option value="moderate">Moderate</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>
        {isFemale && (
          <div>
            <label className={labelClass}>Pregnancy Status</label>
            <select {...register("pregnancy_status")} className={inputClass}>
              <option value="">Select</option>
              <option value="not_pregnant">Not Pregnant</option>
              <option value="pregnant">Pregnant</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
