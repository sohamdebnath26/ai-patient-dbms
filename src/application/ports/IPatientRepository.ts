import type {
  Patient,
  CreatePatientFormInput,
  UpdatePatientInput,
  PatientSearchParams,
  PatientListPage,
  AuthorizationContext,
} from "@domain/patient";

export interface IPatientRepository {
  search(params: PatientSearchParams, auth: AuthorizationContext): Promise<PatientListPage>;
  getById(id: string, auth: AuthorizationContext): Promise<Patient | null>;
  create(input: CreatePatientFormInput, auth: AuthorizationContext): Promise<Patient>;
  update(id: string, input: UpdatePatientInput): Promise<Patient>;
  softDelete(id: string): Promise<void>;
  deregister(id: string): Promise<void>;
}
