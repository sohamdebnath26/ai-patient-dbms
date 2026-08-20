import { Phone, Mail } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import type { PatientFormSectionProps } from "./types";

export function PatientContactSection({ register, errors }: PatientFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <SectionHeading icon={<Phone className="h-4 w-4" />} title="Contact Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Phone <span className="text-red-500">*</span>
            </label>
            <input {...register("phone")} className={inputClass} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" {...register("email")} className={inputClass} />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeading icon={<Mail className="h-4 w-4" />} title="Emergency Contact" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input {...register("emergency_contact_name")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input {...register("emergency_contact_phone")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Relationship</label>
            <input
              {...register("emergency_contact_relationship")}
              placeholder="e.g. Spouse, Parent"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
