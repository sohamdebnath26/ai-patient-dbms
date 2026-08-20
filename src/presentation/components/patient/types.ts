import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import type { PatientFormInput } from "@domain/patient";

export interface PatientFormSectionProps {
  register: UseFormRegister<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
}

export interface PatientAddressSectionProps {
  register: UseFormRegister<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
  setValue: UseFormSetValue<PatientFormInput>;
  watch: UseFormWatch<PatientFormInput>;
}
