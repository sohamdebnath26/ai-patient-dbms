import type { UseFormRegister } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { Users } from "lucide-react";
import { inputClass, labelClass } from "./utils";

export function FamilyHistorySection({
  register,
}: {
  register: UseFormRegister<PatientFormInput>;
}) {
  return (
    <CollapsibleSection
      title="Family History"
      icon={<Users className="h-4 w-4" />}
      collapsible={false}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Family History of Skin Diseases</label>
          <textarea
            {...register("family_history_skin")}
            rows={2}
            placeholder="e.g. Psoriasis, Eczema, Melanoma in relatives"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Family History of Cancer</label>
          <textarea
            {...register("family_history_cancer")}
            rows={2}
            placeholder="Type of cancer and relationship"
            className={inputClass}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
