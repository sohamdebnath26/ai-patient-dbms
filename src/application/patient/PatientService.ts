import type { IPatientRepository } from "@application/ports/IPatientRepository";
import {
  type Patient,
  type CreatePatientFormInput,
  type UpdatePatientInput,
  type PatientSearchParams,
  type PatientListPage,
  type AuthorizationContext,
} from "@domain/patient";

export class PatientService {
  constructor(private readonly repository: IPatientRepository) {}

  async list(params: PatientSearchParams, auth: AuthorizationContext): Promise<PatientListPage> {
    return this.repository.search(params, auth);
  }

  async getById(id: string, auth: AuthorizationContext): Promise<Patient | null> {
    return this.repository.getById(id, auth);
  }

  async create(input: CreatePatientFormInput, auth: AuthorizationContext): Promise<Patient> {
    return this.repository.create(input, auth);
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    return this.repository.update(id, input);
  }

  async archive(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }
}
