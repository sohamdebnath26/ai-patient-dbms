import { CollapsibleSection } from "../CollapsibleSection";
import { User } from "lucide-react";
import { FieldError } from "./helpers";
import { inputClass, labelClass } from "./utils";
import type { PatientFormSectionProps } from "./types";

interface PatientPersonalSectionProps extends PatientFormSectionProps {
  age: number | null;
  showStatus?: boolean;
  statusDisabled?: boolean;
}

export function PatientPersonalSection({
  register,
  errors,
  age,
  showStatus = true,
  statusDisabled = false,
}: PatientPersonalSectionProps) {
  return (
    <CollapsibleSection
      title="Personal Information"
      icon={<User className="h-4 w-4" />}
      collapsible={false}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>First Name *</label>
          <input {...register("first_name")} className={inputClass} />
          <FieldError message={errors.first_name?.message} />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input {...register("last_name")} className={inputClass} />
          <FieldError message={errors.last_name?.message} />
        </div>
        <div>
          <label className={labelClass}>Date of Birth *</label>
          <input type="date" {...register("dob")} className={inputClass} />
          <FieldError message={errors.dob?.message} />
          {age !== null && <p className="mt-1 text-xs text-gray-500">{age} years old</p>}
        </div>
        <div>
          <label className={labelClass}>Gender *</label>
          <select {...register("gender")} className={inputClass}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <FieldError message={errors.gender?.message} />
        </div>
        <div>
          <label className={labelClass}>Blood Group</label>
          <select {...register("blood_group")} className={inputClass}>
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
        {showStatus && (
          <div>
            <label className={labelClass}>Status</label>
            <select {...register("status")} disabled={statusDisabled} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deceased">Deceased</option>
              <option value="deregistered">Deregistered</option>
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={labelClass}>MRN *</label>
          <input {...register("mrn")} className={inputClass} />
          <FieldError message={errors.mrn?.message} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
