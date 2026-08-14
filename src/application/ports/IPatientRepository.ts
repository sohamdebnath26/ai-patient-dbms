import type {
  Patient,
  CreatePatientFormInput,
  UpdatePatientInput,
  PatientSearchParams,
  PatientListPage,
  AuthorizationContext,
} from "@domain/patient";

export interface IPatientRepository {
  search(params: PatientSearchParams): Promise<PatientListPage>;
  getById(id: string): Promise<Patient | null>;
  create(input: CreatePatientFormInput, auth: AuthorizationContext): Promise<Patient>;
  update(id: string, input: UpdatePatientInput): Promise<Patient>;
  softDelete(id: string): Promise<void>;
}
