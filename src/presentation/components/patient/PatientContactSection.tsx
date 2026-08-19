import { MapPin } from "lucide-react";
import { FieldError, SectionHeading } from "./helpers";
import { inputClass, labelClass } from "./utils";
import type { PatientFormSectionProps } from "./types";

export function PatientContactSection({ register, errors }: PatientFormSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeading icon={<MapPin className="h-4 w-4" />} title="Contact Information" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Phone *</label>
          <input {...register("phone")} className={inputClass} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" {...register("email")} className={inputClass} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label className={labelClass}>Address Line 1 *</label>
          <input {...register("address_line1")} className={inputClass} />
          <FieldError message={errors.address_line1?.message} />
        </div>
        <div>
          <label className={labelClass}>Address Line 2</label>
          <input {...register("address_line2")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input {...register("city")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input {...register("state")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input {...register("country")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Postal Code</label>
          <input {...register("postal_code")} className={inputClass} />
        </div>
      </div>

      <h4 className="pt-2 text-sm font-semibold text-gray-500">Emergency Contact</h4>
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
  );
}
