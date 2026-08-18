import type { UseFormRegister } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { Stethoscope } from "lucide-react";
import { inputClass, labelClass } from "./utils";

export function DermatologySection({ register }: { register: UseFormRegister<PatientFormInput> }) {
  return (
    <CollapsibleSection title="Dermatology Information" icon={<Stethoscope className="h-4 w-4" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Primary Diagnosis</label>
          <input {...register("primary_diagnosis")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Secondary Diagnosis</label>
          <input {...register("secondary_diagnosis")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Skin Type (Fitzpatrick)</label>
          <select {...register("skin_type")} className={inputClass}>
            <option value="">Select</option>
            <option value="I">I — Always burns, never tans</option>
            <option value="II">II — Usually burns, tans minimally</option>
            <option value="III">III — Sometimes burns, tans uniformly</option>
            <option value="IV">IV — Rarely burns, tans easily</option>
            <option value="V">V — Very rarely burns, tans profusely</option>
            <option value="VI">VI — Never burns, deeply pigmented</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Disease Severity</label>
          <select {...register("disease_severity")} className={inputClass}>
            <option value="">Select</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Affected Body Areas</label>
          <input
            {...register("affected_body_areas")}
            placeholder="e.g. Face, Scalp, Trunk, Arms"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Duration</label>
          <input {...register("duration")} placeholder="e.g. 6 months" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Current Treatment</label>
          <input {...register("current_treatment")} className={inputClass} />
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register("current_flare")}
              className="h-4 w-4 rounded border-gray-300"
            />
            Current Flare
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register("previous_skin_cancer")}
              className="h-4 w-4 rounded border-gray-300"
            />
            Previous Skin Cancer
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Family History</label>
          <textarea {...register("family_history")} rows={2} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea {...register("medical_notes")} rows={3} className={inputClass} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
