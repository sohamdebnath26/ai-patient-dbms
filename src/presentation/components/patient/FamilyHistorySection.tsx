import type { UseFormRegister } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";
import { Users } from "lucide-react";
import { SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";

export function FamilyHistorySection({
  register,
}: {
  register: UseFormRegister<PatientFormInput>;
}) {
  return (
    <div className="space-y-3">
      <SectionHeading icon={<Users className="h-4 w-4" />} title="Family History" />
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
    </div>
  );
}
