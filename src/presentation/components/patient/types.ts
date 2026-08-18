import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";

export interface PatientFormSectionProps {
  register: UseFormRegister<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
}
