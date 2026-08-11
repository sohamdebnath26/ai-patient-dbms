import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientSearchParams,
  PatientListPage,
} from "@domain/patient";

export interface IPatientRepository {
  search(params: PatientSearchParams): Promise<PatientListPage>;
  getById(id: string): Promise<Patient | null>;
  create(input: CreatePatientInput, userId: string): Promise<Patient>;
  update(id: string, input: UpdatePatientInput): Promise<Patient>;
  softDelete(id: string): Promise<void>;
}
