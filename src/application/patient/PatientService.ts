import type { IPatientRepository } from "@application/ports/IPatientRepository";
import {
  type Patient,
  type CreatePatientFormInput,
  type UpdatePatientInput,
  type PatientSearchParams,
  type PatientListPage,
  type AuthorizationContext,
  AuthorizationContextSchema,
  MissingOrganizationError,
} from "@domain/patient";

export class PatientService {
  constructor(private readonly repository: IPatientRepository) {}

  async list(params: PatientSearchParams): Promise<PatientListPage> {
    return this.repository.search(params);
  }

  async getById(id: string): Promise<Patient | null> {
    return this.repository.getById(id);
  }

  async create(input: CreatePatientFormInput, auth: AuthorizationContext): Promise<Patient> {
    const validated = AuthorizationContextSchema.safeParse(auth);
    if (!validated.success) {
      throw new MissingOrganizationError();
    }
    return this.repository.create(input, validated.data);
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    return this.repository.update(id, input);
  }

  async archive(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }
}
